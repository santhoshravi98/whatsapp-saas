/**
 * Message processor — the core pipeline for one inbound WhatsApp event.
 *
 * Lives outside the route handler so it can be invoked from:
 *   - the QStash worker (production / preview)
 *   - the webhook itself, inline, when running on localhost (dev only)
 *
 * Tenant resolution happens here, not in the webhook intake. Once resolved,
 * every downstream DB call goes through a `TenantClient` so isolation is
 * enforced by construction — see `clients/supabase.ts`.
 *
 * Returns void; persists everything it needs and never throws on
 * "expected" misses (non-text events, missing message, etc.).
 */
import { z } from "zod";
import { logger } from "@/core/logger";
import { tenantClient } from "@/core/clients/supabase";
import { markRead, sendText } from "@/core/clients/whatsapp";
import { complete } from "@/core/clients/claude";
import {
  getOrCreateActiveConversation,
  upsertUser,
} from "@/core/messaging/conversations";
import {
  loadHistory,
  recordInboundText,
  recordOutboundText,
} from "@/core/messaging/messages";
import { setEventTenant } from "@/core/messaging/webhook-events";
import { resolveTenant, UnknownTenantError } from "@/core/tenants";
import { getSegment } from "@/segments";

const InboundTextMessage = z.object({
  from: z.string(),
  id:   z.string(),
  type: z.literal("text"),
  text: z.object({ body: z.string() }),
});

const Contact = z.object({
  wa_id: z.string(),
  profile: z.object({ name: z.string().optional() }).optional(),
});

const WebhookPayload = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            metadata: z
              .object({
                phone_number_id: z.string().optional(),
                display_phone_number: z.string().optional(),
              })
              .optional(),
            messages: z.array(z.unknown()).optional(),
            contacts: z.array(Contact).optional(),
          }),
        }),
      ),
    }),
  ),
});

export async function processWebhookPayload(
  payload: unknown,
  opts: { eventId?: string } = {},
): Promise<void> {
  const parsed = WebhookPayload.safeParse(payload);
  if (!parsed.success) {
    logger.info("webhook_unsupported_shape");
    return;
  }

  const change = parsed.data.entry[0]?.changes[0]?.value;
  const rawMsg = change?.messages?.[0];
  if (!rawMsg) return;

  const msg = InboundTextMessage.safeParse(rawMsg);
  if (!msg.success) {
    logger.info("webhook_non_text_message", { type: (rawMsg as { type?: string }).type });
    return;
  }

  const phoneNumberId = change?.metadata?.phone_number_id;
  if (!phoneNumberId) {
    logger.warn("webhook_missing_phone_number_id");
    return;
  }

  let tenant;
  try {
    tenant = await resolveTenant(phoneNumberId);
  } catch (err) {
    if (err instanceof UnknownTenantError) {
      logger.warn("webhook_unknown_tenant", { phoneNumberId });
      return; // 200 to Meta; no retry will help an unprovisioned number
    }
    throw err;
  }

  const tc = tenantClient(tenant.id);
  if (opts.eventId) {
    await setEventTenant(opts.eventId, tenant.id);
  }

  const segment = getSegment(tenant.segment);

  const contact = change?.contacts?.[0];
  const user = await upsertUser(tc, {
    waId: msg.data.from,
    name: contact?.profile?.name ?? null,
  });
  const conv = await getOrCreateActiveConversation(tc, user);

  await recordInboundText(tc, {
    conversationId: conv.id,
    waMessageId: msg.data.id,
    text: msg.data.text.body,
  });

  if (conv.status === "human") {
    // Blue ticks so the customer knows it was received, but no typing dots —
    // a human is replying on their own time.
    await markRead(msg.data.id);
    return;
  }

  const segCtx = {
    tenant,
    tc,
    user: { id: user.id, name: user.name, waId: user.wa_id },
    conversation: { id: conv.id },
  };

  // Fire read+typing in parallel with history load. The typing indicator
  // stays visible until sendText below or ~25s elapses, whichever first.
  const [history] = await Promise.all([
    loadHistory(tc, conv.id),
    markRead(msg.data.id, { showTyping: true }),
  ]);
  const system = segment.buildSystemPrompt(segCtx);
  const completion = await complete({
    system,
    messages: [...history, { role: "user", content: msg.data.text.body }],
    maxTokens: 512,
  });

  if (!completion.text) {
    logger.warn("agent_empty_reply", { conversationId: conv.id });
    return;
  }

  const { cleanText } = segment.onAgentReply
    ? await segment.onAgentReply(segCtx, completion.text)
    : { cleanText: completion.text };

  if (!cleanText) return;

  const sent = await sendText(msg.data.from, cleanText);
  await recordOutboundText(tc, {
    conversationId: conv.id,
    waMessageId: sent.wa_message_id,
    text: cleanText,
    agentName: segment.name,
  });
}

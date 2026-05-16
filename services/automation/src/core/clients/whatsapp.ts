/**
 * WhatsApp Cloud API client.
 *
 * Surface area kept minimal on purpose — extend with image/template/interactive
 * helpers as features land. The rest of the codebase should not depend on
 * Meta's payload shape.
 */
import { env } from "@/core/config/env";
import { logger } from "@/core/logger";

const GRAPH_BASE = "https://graph.facebook.com";

type SendTextResult = { wa_message_id: string };

function messagesUrl(): string {
  return `${GRAPH_BASE}/${env.META_GRAPH_API_VERSION}/${env.META_PHONE_NUMBER_ID}/messages`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function sendText(to: string, body: string): Promise<SendTextResult> {
  const res = await fetch(messagesUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error("whatsapp_send_failed", { status: res.status, body: errText });
    throw new Error(`WhatsApp send failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { messages: Array<{ id: string }> };
  const id = data.messages?.[0]?.id;
  if (!id) throw new Error("WhatsApp send: no message id returned");
  return { wa_message_id: id };
}

/**
 * Mark an inbound message as read (blue ticks for the customer) and
 * optionally show the typing indicator while we generate a reply.
 *
 * Meta combines both into a single API call. The typing indicator hides
 * automatically when we send the outbound reply, or after ~25 seconds.
 *
 * Never throws — read receipts and typing dots are nice-to-haves; a failure
 * here must not block the agent reply pipeline. We log and move on.
 */
export async function markRead(
  messageId: string,
  opts: { showTyping?: boolean } = {},
): Promise<void> {
  try {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };
    if (opts.showTyping) {
      body.typing_indicator = { type: "text" };
    }

    const res = await fetch(messagesUrl(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn("whatsapp_mark_read_failed", {
        status: res.status,
        body: errText,
        showTyping: !!opts.showTyping,
      });
    }
  } catch (err) {
    logger.warn("whatsapp_mark_read_threw", {
      error: (err as Error).message,
    });
  }
}

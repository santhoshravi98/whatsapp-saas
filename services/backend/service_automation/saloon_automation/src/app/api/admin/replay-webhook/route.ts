/**
 * Replay a stored webhook_event through the processor.
 *
 * Use case: a tenant's QStash retries hit the cap, the event landed in the
 * DLQ-equivalent (status='failed'), the underlying bug is now fixed — we
 * want to drain those without waiting for a new inbound message.
 *
 * Auth: Bearer ADMIN_API_KEY. Required field: eventId.
 *
 *   curl -X POST $URL/api/admin/replay-webhook \
 *     -H "Authorization: Bearer $ADMIN_API_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"eventId":"wamid.xxx"}'
 *
 * The replay runs inline. For bulk drains call this in a loop from a script.
 */
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/core/admin/auth";
import { audit } from "@/core/admin/audit";
import { runWithContext } from "@/core/context";
import { logger } from "@/core/logger";
import {
  getEvent,
  markFailed,
  markProcessed,
  markProcessing,
} from "@/core/messaging/webhook-events";
import { processWebhookPayload } from "@/core/messaging/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({ eventId: z.string().min(1) });

export async function POST(req: Request) {
  return runWithContext({ requestId: crypto.randomUUID() }, async () => {
    const auth = authorizeAdmin(req);
    if (!auth.ok) return new NextResponse(auth.body, { status: auth.status });

    let parsed;
    try {
      parsed = Body.parse(await req.json());
    } catch (err) {
      return NextResponse.json({ error: "bad request", detail: (err as Error).message }, { status: 400 });
    }

    let event;
    try {
      event = await getEvent(parsed.eventId);
    } catch (err) {
      return NextResponse.json({ error: "event not found", detail: (err as Error).message }, { status: 404 });
    }

    await markProcessing(parsed.eventId);
    try {
      await processWebhookPayload(event.payload, { eventId: parsed.eventId });
      await markProcessed(parsed.eventId);
      await audit({
        tenantId: event.tenant_id,
        actor: `admin:${auth.keyHint}`,
        action: "webhook_replay",
        target: parsed.eventId,
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      const msg = (err as Error).message;
      logger.error("webhook_replay_failed", { eventId: parsed.eventId, error: msg });
      await markFailed(parsed.eventId, msg, (event.attempts ?? 0) + 1);
      await audit({
        tenantId: event.tenant_id,
        actor: `admin:${auth.keyHint}`,
        action: "webhook_replay_failed",
        target: parsed.eventId,
        details: { error: msg },
      });
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
  });
}

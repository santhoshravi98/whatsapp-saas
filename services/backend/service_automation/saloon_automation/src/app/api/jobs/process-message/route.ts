/**
 * Background worker — process one inbound WhatsApp message.
 *
 * Invoked by QStash in production / preview. QStash signs every request; we
 * verify here. On any thrown error we return 500 so QStash retries with
 * exponential backoff.
 *
 * Terminal failure handling: QStash includes `upstash-retried` (current
 * attempt) and we know the publish-time `retries` cap (5 in qstash.ts). When
 * the current attempt equals the cap, this is the LAST chance — we capture
 * to Sentry with full context so the on-call person can investigate before
 * the message hits the dead-letter queue.
 *
 * The actual pipeline lives in `core/messaging/processor.ts` so it can also
 * be invoked inline from the webhook in localhost dev mode.
 */
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/core/config/env";
import { qstashReceiver } from "@/core/clients/qstash";
import { runWithContext } from "@/core/context";
import { logger } from "@/core/logger";
import { captureException } from "@/core/sentry";
import {
  getEvent,
  markFailed,
  markProcessed,
  markProcessing,
} from "@/core/messaging/webhook-events";
import { processWebhookPayload } from "@/core/messaging/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro; Hobby caps at 10s

// Must match `retries:` in core/clients/qstash.ts.
const MAX_RETRIES = 5;

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  return runWithContext({ requestId }, async () => {
    const rawBody = await req.text();
    const signature = req.headers.get("upstash-signature") ?? "";

    try {
      await qstashReceiver().verify({
        signature,
        body: rawBody,
        url: `${env.APP_BASE_URL}/api/jobs/process-message`,
      });
    } catch {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const { eventId } = JSON.parse(rawBody) as { eventId: string };
    const retriedHeader = Number(req.headers.get("upstash-retried") ?? "0");
    const isFinalAttempt = retriedHeader >= MAX_RETRIES;

    const event = await getEvent(eventId);
    if (event.status === "processed") {
      return new NextResponse("dup", { status: 200 });
    }
    await markProcessing(eventId);

    try {
      await processWebhookPayload(event.payload, { eventId });
      await markProcessed(eventId);
      return new NextResponse("ok", { status: 200 });
    } catch (err) {
      const msg = (err as Error).message;
      const attempts = (event.attempts ?? 0) + 1;
      logger.error("job_failed", { eventId, attempts, error: msg, final: isFinalAttempt });
      await markFailed(eventId, msg, attempts);

      // Final attempt: page the on-call by raising to Sentry with the
      // full payload preview (clipped) so they can replay manually.
      if (isFinalAttempt) {
        captureException(err, {
          eventId,
          attempts,
          payloadPreview: JSON.stringify(event.payload).slice(0, 4000),
        });
      }

      return new NextResponse("retry", { status: 500 });
    }
  });
}

/**
 * Meta WhatsApp webhook endpoint.
 *
 * Responsibilities (each in order, total budget: ~1 second):
 *   1. Verify Meta signature (HMAC-SHA256 of raw body with app secret).
 *   2. Reject stale payloads (replay protection on top of HMAC).
 *   3. Extract message id (idempotency key) — fall back to a uuid otherwise.
 *   4. Persist raw payload to webhook_events (UPSERT, dedup on id).
 *   5. Enqueue a QStash job — the worker does Claude + send.
 *   6. Return 200 OK to Meta.
 *
 * If any step after signature verification fails, return 500: Meta retries
 * for up to 7 days with exponential backoff and we will recover.
 *
 * GET on this same path handles Meta's verification handshake.
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { env } from "@/core/config/env";
import { isRawPayloadFresh, verifyMetaSignature } from "@/core/crypto";
import { runWithContext } from "@/core/context";
import { logger } from "@/core/logger";
import { captureException } from "@/core/sentry";
import { enqueueProcessMessage } from "@/core/clients/qstash";
import { markProcessed, markProcessing, recordReceived } from "@/core/messaging/webhook-events";
import { processWebhookPayload } from "@/core/messaging/processor";

/**
 * In local dev (APP_BASE_URL points at localhost) QStash refuses to publish
 * to a loopback callback URL. To still exercise the full pipeline locally,
 * we run the worker inline. Production / preview always uses the queue.
 */
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(env.APP_BASE_URL);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET — Meta verification handshake ────────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

// ─── POST — inbound webhook ──────────────────────────────────────────────
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  return runWithContext({ requestId }, async () => {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (!verifyMetaSignature(rawBody, signature, env.META_APP_SECRET)) {
      logger.warn("webhook_bad_signature");
      return new NextResponse("unauthorized", { status: 401 });
    }

    if (!isRawPayloadFresh(rawBody, env.WEBHOOK_MAX_AGE_SEC)) {
      logger.warn("webhook_stale_payload", { maxAge: env.WEBHOOK_MAX_AGE_SEC });
      // 401 — a stale-but-signed payload is treated the same as an unauth one.
      // Meta will not retry, which is what we want.
      return new NextResponse("stale", { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new NextResponse("bad json", { status: 400 });
    }

    const eventId = extractMessageId(payload) ?? crypto.randomUUID();

    try {
      await recordReceived(eventId, payload);

      if (IS_LOCAL) {
        // Dev: run the pipeline inline. The smoke test sees the real result;
        // we wait so failures surface in the dev terminal.
        await markProcessing(eventId);
        await processWebhookPayload(payload, { eventId });
        await markProcessed(eventId);
      } else {
        await enqueueProcessMessage(eventId, { requestId });
      }
    } catch (err) {
      logger.error("webhook_enqueue_failed", {
        eventId,
        error: (err as Error).message,
      });
      captureException(err, { eventId, stage: "webhook_enqueue" });
      return new NextResponse("retry", { status: 500 });
    }

    return new NextResponse("ok", { status: 200 });
  });
}

function extractMessageId(payload: unknown): string | null {
  try {
    const entry = (payload as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ id?: string }>; statuses?: Array<{ id?: string }> } }> }> })
      .entry?.[0];
    const change = entry?.changes?.[0];
    const msgId = change?.value?.messages?.[0]?.id;
    if (typeof msgId === "string") return msgId;
    // Status callbacks have `statuses[].id` (the original outbound message id).
    // Suffix with the status type so a delivered + read event don't collide.
    const status = change?.value?.statuses?.[0];
    if (status && typeof status.id === "string") {
      const kind = (status as { status?: string }).status ?? "status";
      return `${status.id}:${kind}`;
    }
    return null;
  } catch {
    return null;
  }
}

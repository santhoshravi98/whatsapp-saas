/**
 * Meta WhatsApp webhook endpoint.
 *
 * Responsibilities (each in order, total budget: ~1 second):
 *   1. Verify Meta signature (HMAC-SHA256 of raw body with app secret).
 *   2. Extract message id (idempotency key) — fall back to a uuid otherwise.
 *   3. Persist raw payload to webhook_events (UPSERT, dedup on id).
 *   4. Enqueue a QStash job — the worker does Claude + send.
 *   5. Return 200 OK to Meta.
 *
 * If any step after signature verification fails, return 500: Meta retries
 * for up to 7 days with exponential backoff and we will recover.
 *
 * GET on this same path handles Meta's verification handshake.
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { env } from "@/core/config/env";
import { verifyMetaSignature } from "@/core/crypto";
import { logger } from "@/core/logger";
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
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature, env.META_APP_SECRET)) {
    logger.warn("webhook_bad_signature");
    return new NextResponse("unauthorized", { status: 401 });
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
      await enqueueProcessMessage(eventId);
    }
  } catch (err) {
    logger.error("webhook_enqueue_failed", {
      eventId,
      error: (err as Error).message,
    });
    return new NextResponse("retry", { status: 500 });
  }

  return new NextResponse("ok", { status: 200 });
}

function extractMessageId(payload: unknown): string | null {
  try {
    const entry = (payload as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ id?: string }> } }> }> })
      .entry?.[0];
    const change = entry?.changes?.[0];
    const msgId = change?.value?.messages?.[0]?.id;
    return typeof msgId === "string" ? msgId : null;
  } catch {
    return null;
  }
}

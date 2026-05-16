/**
 * Background worker — process one inbound WhatsApp message.
 *
 * Invoked by QStash in production / preview. QStash signs every request; we
 * verify here. On any thrown error we return 500 so QStash retries with
 * exponential backoff.
 *
 * The actual pipeline lives in `core/messaging/processor.ts` so it can also
 * be invoked inline from the webhook in localhost dev mode.
 */
import { NextResponse } from "next/server";
import { env } from "@/core/config/env";
import { qstashReceiver } from "@/core/clients/qstash";
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
export const maxDuration = 60; // Vercel Pro; Hobby caps at 10s

export async function POST(req: Request) {
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
    logger.error("job_failed", { eventId, error: msg });
    await markFailed(eventId, msg, (event.attempts ?? 0) + 1);
    return new NextResponse("retry", { status: 500 });
  }
}

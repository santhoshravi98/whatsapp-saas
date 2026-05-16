/**
 * Upstash QStash — durable HTTP-based job queue.
 *   - publish:  enqueue jobs from the webhook handler
 *   - receiver: verify inbound job requests in the worker route
 */
import { Client, Receiver } from "@upstash/qstash";
import { env } from "@/core/config/env";

let _client: Client | null = null;
let _receiver: Receiver | null = null;

export function qstashClient(): Client {
  if (_client) return _client;
  _client = new Client({ token: env.QSTASH_TOKEN });
  return _client;
}

export function qstashReceiver(): Receiver {
  if (_receiver) return _receiver;
  _receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
  return _receiver;
}

export async function enqueueProcessMessage(eventId: string): Promise<void> {
  await qstashClient().publishJSON({
    url: `${env.APP_BASE_URL}/api/jobs/process-message`,
    body: { eventId },
    retries: 5,
    deduplicationId: eventId,
  });
}

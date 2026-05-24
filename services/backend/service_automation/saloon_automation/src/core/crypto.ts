/**
 * Cryptographic helpers — signature verification only.
 *
 * Meta signs each webhook with HMAC-SHA256 of the raw body using your App
 * Secret, sent as `x-hub-signature-256: sha256=<hex>`. Verifying this is the
 * ONLY thing standing between the public webhook URL and the rest of the app.
 *
 * On top of HMAC we also reject "fresh-looking" payloads whose embedded
 * message timestamp is too old — closes the replay window if an attacker
 * captures a single signed payload off the wire. Meta does not send a
 * separate timestamp header, so we read it from the payload itself
 * (`entry[].changes[].value.messages[].timestamp`, unix seconds as string).
 */
import crypto from "node:crypto";

export function verifyMetaSignature(
  rawBody: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header || !header.startsWith("sha256=")) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const provided = header.slice("sha256=".length);
  if (provided.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * True if the payload's earliest message timestamp is within `maxAgeSec` of
 * `now`. Returns `true` when the payload has no message timestamps at all
 * (status callbacks, verification handshakes, etc.) — the HMAC alone is the
 * security boundary for those.
 *
 * Side effect: parses the payload as JSON. Callers that already have a parsed
 * object can use `isPayloadFresh` directly.
 */
export function isRawPayloadFresh(rawBody: string, maxAgeSec: number, nowSec = Math.floor(Date.now() / 1000)): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }
  return isPayloadFresh(parsed, maxAgeSec, nowSec);
}

export function isPayloadFresh(payload: unknown, maxAgeSec: number, nowSec = Math.floor(Date.now() / 1000)): boolean {
  const stamps = extractMessageTimestamps(payload);
  if (stamps.length === 0) return true;
  const oldest = Math.min(...stamps);
  return nowSec - oldest <= maxAgeSec;
}

function extractMessageTimestamps(payload: unknown): number[] {
  const out: number[] = [];
  try {
    const entries = (payload as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ timestamp?: string | number }> } }> }> }).entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        for (const m of change.value?.messages ?? []) {
          const t = typeof m.timestamp === "string" ? Number(m.timestamp) : m.timestamp;
          if (typeof t === "number" && Number.isFinite(t)) out.push(t);
        }
      }
    }
  } catch {
    // fall through — empty array
  }
  return out;
}

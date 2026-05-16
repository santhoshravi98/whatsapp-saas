/**
 * Cryptographic helpers — signature verification only.
 *
 * Meta signs each webhook with HMAC-SHA256 of the raw body using your App
 * Secret, sent as `x-hub-signature-256: sha256=<hex>`. Verifying this is the
 * ONLY thing standing between the public webhook URL and the rest of the app.
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

/**
 * Bearer auth for /api/admin/* routes.
 *
 * One shared secret (`ADMIN_API_KEY`), set in env. In production an unset key
 * returns 503 — there's no "open by default" admin surface.
 *
 * Comparison is constant-time; we ALSO log a key hint (first 4 chars) on
 * every successful call so audit_logs can attribute the action without
 * storing the full secret.
 */
import crypto from "node:crypto";
import { env } from "@/core/config/env";

export type AuthResult =
  | { ok: true; keyHint: string }
  | { ok: false; status: number; body: string };

export function authorizeAdmin(req: Request): AuthResult {
  if (!env.ADMIN_API_KEY) {
    return { ok: false, status: 503, body: "admin disabled (ADMIN_API_KEY unset)" };
  }
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m || !m[1]) return { ok: false, status: 401, body: "missing bearer" };
  const provided = m[1].trim();
  const expected = env.ADMIN_API_KEY;
  if (provided.length !== expected.length) {
    return { ok: false, status: 401, body: "unauthorized" };
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (!crypto.timingSafeEqual(a, b)) {
    return { ok: false, status: 401, body: "unauthorized" };
  }
  return { ok: true, keyHint: provided.slice(0, 4) };
}

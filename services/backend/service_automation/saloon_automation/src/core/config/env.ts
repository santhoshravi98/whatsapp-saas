/**
 * Type-safe environment loader. Validated once at module load — missing or
 * invalid vars fail fast at boot, not at the first inbound request.
 *
 * Tenant-specific settings (salon name, hours, etc.) do NOT live here. Those
 * belong in `tenants.config` JSONB so we can support multiple tenants without
 * a redeploy.
 */
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url(),

  META_APP_SECRET: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(1),
  META_PHONE_NUMBER_ID: z.string().min(1),
  META_ACCESS_TOKEN: z.string().min(1),
  META_GRAPH_API_VERSION: z.string().default("v21.0"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),

  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  /**
   * Fallback model used when the primary returns 5xx / overload after retries.
   * Set to the same value as ANTHROPIC_MODEL to disable fallback.
   */
  ANTHROPIC_FALLBACK_MODEL: z.string().default("claude-sonnet-4-6"),

  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),

  /**
   * Webhook freshness window in seconds. We reject signed webhooks whose
   * message timestamp is older than this — replay protection on top of HMAC.
   */
  WEBHOOK_MAX_AGE_SEC: z.coerce.number().int().positive().default(300),

  /**
   * Outbound rate limit per (tenant, recipient). 0 disables the limiter.
   */
  OUTBOUND_RATE_LIMIT_PER_MIN: z.coerce.number().int().nonnegative().default(10),

  /**
   * Bearer token required for /api/admin/* endpoints (GDPR delete, replay).
   * Generate with `openssl rand -hex 32` and store in your secret manager.
   */
  ADMIN_API_KEY: z.string().min(16).optional(),

  /**
   * Conversation summary refresh: when the message count in a conversation
   * crosses this threshold, the next agent turn refreshes `conversations.summary`.
   */
  SUMMARY_REFRESH_AFTER_TURNS: z.coerce.number().int().positive().default(40),

  /**
   * The tenant id used by ops scripts (e.g. backfill-tenant-phone) when the
   * caller doesn't pass one explicitly. Runtime tenant routing does NOT use
   * this — `resolveTenant()` looks up by Meta phone_number_id.
   */
  DEFAULT_TENANT_ID: z.string().uuid().default("00000000-0000-0000-0000-000000000000"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment — see logs above");
}

export const env = parsed.data;
export type Env = typeof env;

// Loud (but non-fatal) warnings for prod misconfiguration. Logged once at boot.
if (env.NODE_ENV === "production") {
  if (!env.SENTRY_DSN) {
    console.warn("[env] SENTRY_DSN unset in production — errors will not be reported");
  }
  if (!env.ADMIN_API_KEY) {
    console.warn("[env] ADMIN_API_KEY unset in production — admin endpoints disabled");
  }
}

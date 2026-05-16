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

  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),

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

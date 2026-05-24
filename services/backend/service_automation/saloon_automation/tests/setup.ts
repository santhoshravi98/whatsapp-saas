/**
 * Vitest setup — seed the env validator with safe placeholders so importing
 * any module that touches `env` doesn't blow up during `vi.import()`.
 *
 * Real values for integration tests live in `.env.local` (gitignored) and
 * are loaded by the `check:config` script, not by unit tests.
 */
const defaults: Record<string, string> = {
  NODE_ENV: "test",
  APP_BASE_URL: "http://localhost:3000",
  META_APP_SECRET: "test-secret",
  META_VERIFY_TOKEN: "test-verify",
  META_PHONE_NUMBER_ID: "test-phone-id",
  META_ACCESS_TOKEN: "test-access-token",
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  QSTASH_TOKEN: "test-qstash-token",
  QSTASH_CURRENT_SIGNING_KEY: "test-qstash-current",
  QSTASH_NEXT_SIGNING_KEY: "test-qstash-next",
  ANTHROPIC_API_KEY: "test-anthropic-key",
};

for (const [k, v] of Object.entries(defaults)) {
  if (!process.env[k]) process.env[k] = v;
}

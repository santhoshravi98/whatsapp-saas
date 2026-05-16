/**
 * Backfill `tenants.phone_number_id` for the default tenant.
 *
 * Run once after applying migration 0004_tenants_phone_number_id.sql.
 * Reads META_PHONE_NUMBER_ID and DEFAULT_TENANT_ID from .env.local.
 *
 * Usage:
 *   npm run backfill:tenant-phone
 *   npm run backfill:tenant-phone -- <tenant-uuid>   # explicit override
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    const commentIdx = value.indexOf(" #");
    if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PHONE        = process.env.META_PHONE_NUMBER_ID;
const TENANT_ID    = process.argv[2] ?? process.env.DEFAULT_TENANT_ID
                     ?? "00000000-0000-0000-0000-000000000000";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}
if (!PHONE) {
  console.error("✗ META_PHONE_NUMBER_ID missing from .env.local");
  process.exit(1);
}

async function main() {
  const url = `${SUPABASE_URL}/rest/v1/tenants?id=eq.${TENANT_ID}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ phone_number_id: PHONE }),
  });

  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const rows = (await res.json()) as Array<{ id: string; phone_number_id: string }>;
  if (!rows.length) {
    console.error(`✗ No tenant with id=${TENANT_ID} — run migration 0003 first?`);
    process.exit(1);
  }
  console.log(`✓ Set phone_number_id=${PHONE} on tenant ${rows[0]!.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

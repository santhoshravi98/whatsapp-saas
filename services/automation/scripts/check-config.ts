/**
 * Pre-deploy config check.
 *
 * Verifies every external service the app talks to is reachable with the
 * credentials in `.env.local`. Run BEFORE deploying — saves the round-trip
 * of "deploy, fail, fix, redeploy".
 *
 * Usage:
 *   npx tsx scripts/check-config.ts
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

type Check = { name: string; run: () => Promise<string> };

const checks: Check[] = [
  {
    name: "env: required vars present",
    async run() {
      const required = [
        "APP_BASE_URL",
        "META_APP_SECRET",
        "META_VERIFY_TOKEN",
        "META_PHONE_NUMBER_ID",
        "META_ACCESS_TOKEN",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "QSTASH_TOKEN",
        "QSTASH_CURRENT_SIGNING_KEY",
        "QSTASH_NEXT_SIGNING_KEY",
        "ANTHROPIC_API_KEY",
      ];
      const missing = required.filter((k) => !process.env[k]);
      if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);
      return `all ${required.length} present`;
    },
  },
  {
    name: "Supabase: connect + list tenants",
    async run() {
      const url = `${process.env.SUPABASE_URL}/rest/v1/tenants?select=id,name,segment&limit=5`;
      const res = await fetch(url, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const rows = (await res.json()) as Array<{ id: string; segment: string }>;
      if (!rows.length) throw new Error("no tenants — did you run migration 0003?");
      return `${rows.length} tenant(s); first segment=${rows[0]!.segment}`;
    },
  },
  {
    name: "Tenant routing: phone_number_id is backfilled",
    async run() {
      const phone = process.env.META_PHONE_NUMBER_ID;
      const url = `${process.env.SUPABASE_URL}/rest/v1/tenants?phone_number_id=eq.${phone}&select=id,name`;
      const res = await fetch(url, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const rows = (await res.json()) as Array<{ id: string; name: string }>;
      if (!rows.length) {
        throw new Error(
          `no tenant for phone_number_id=${phone}. Run: npm run backfill:tenant-phone`,
        );
      }
      return `routed to tenant "${rows[0]!.name}" (${rows[0]!.id})`;
    },
  },
  {
    name: "Anthropic: ping with smallest possible request",
    async run() {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
          max_tokens: 16,
          messages: [{ role: "user", content: "say hi" }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { model: string; usage: { input_tokens: number } };
      return `model=${body.model}, in_tokens=${body.usage.input_tokens}`;
    },
  },
  {
    name: "WhatsApp Cloud API: token has access to phone number",
    async run() {
      const url = `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION ?? "v21.0"}/${process.env.META_PHONE_NUMBER_ID}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { display_phone_number?: string };
      return `phone=${body.display_phone_number ?? "(unknown)"}`;
    },
  },
  {
    name: "QStash: token valid (list schedules)",
    async run() {
      const res = await fetch("https://qstash.upstash.io/v2/schedules", {
        headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return "token OK";
    },
  },
];

async function main() {
  let failed = 0;
  for (const c of checks) {
    try {
      const detail = await c.run();
      console.log(`✓ ${c.name} — ${detail}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${c.name} — ${(err as Error).message}`);
    }
  }

  console.log("");
  if (failed) {
    console.error(`${failed} check(s) failed.`);
    process.exit(1);
  } else {
    console.log("All checks passed. Safe to deploy.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

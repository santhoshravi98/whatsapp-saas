/**
 * Local smoke test — simulates a Meta inbound webhook end-to-end.
 *
 * What it does:
 *   1. Loads .env.local
 *   2. Builds a fake WhatsApp text-message payload
 *   3. Signs it with META_APP_SECRET (the way Meta does)
 *   4. POSTs it to your locally-running /api/webhook
 *   5. Reports whether the webhook accepted it (200) and prints next steps
 *
 * What this does NOT test:
 *   - The QStash → worker round-trip (worker is a separate URL — QStash needs
 *     a public callback URL; can't reach localhost). To test that, deploy to
 *     a preview URL on Vercel, or run the verify-only script below.
 *
 * Run:
 *   npm run dev                  # terminal 1
 *   npx tsx scripts/smoke-test.ts # terminal 2
 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── load .env.local ─────────────────────────────────────────────────────
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
    // strip optional surrounding quotes + trailing inline comments
    value = value.replace(/^["']|["']$/g, "");
    const commentIdx = value.indexOf(" #");
    if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const APP_SECRET = process.env.META_APP_SECRET;
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

if (!APP_SECRET) {
  console.error("✗ META_APP_SECRET missing from .env.local");
  process.exit(1);
}

// ─── build a fake Meta webhook payload ───────────────────────────────────
const FAKE_FROM = "919999999999";            // pretend sender's WhatsApp id
const FAKE_NAME = "Smoke Test";
const FAKE_TEXT = process.argv[2] ?? "Hi, can I book a haircut for tomorrow at 4pm?";
const FAKE_MESSAGE_ID = `wamid.SMOKE_${Date.now()}`;

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA_ID",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "+1...",
              phone_number_id: PHONE_NUMBER_ID,
            },
            contacts: [{ wa_id: FAKE_FROM, profile: { name: FAKE_NAME } }],
            messages: [
              {
                from: FAKE_FROM,
                id: FAKE_MESSAGE_ID,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: "text",
                text: { body: FAKE_TEXT },
              },
            ],
          },
        },
      ],
    },
  ],
};

const rawBody = JSON.stringify(payload);
const signature =
  "sha256=" +
  crypto.createHmac("sha256", APP_SECRET).update(rawBody, "utf8").digest("hex");

// ─── send + report ───────────────────────────────────────────────────────
async function main() {
  const url = `${APP_BASE_URL}/api/webhook`;
  console.log(`→ POST ${url}`);
  console.log(`  message: ${JSON.stringify(FAKE_TEXT)}`);
  console.log(`  id:      ${FAKE_MESSAGE_ID}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": signature,
    },
    body: rawBody,
  });

  const text = await res.text();

  if (res.status === 200) {
    console.log(`✓ webhook 200 OK (${text})`);
    console.log("");
    console.log("Next checks (in another terminal):");
    console.log(`  1. Postgres: row in webhook_events for id "${FAKE_MESSAGE_ID}"`);
    console.log("     psql \"$SUPABASE_DB_URL\" -c \\");
    console.log(`     \"SELECT id, status, attempts FROM webhook_events WHERE id='${FAKE_MESSAGE_ID}';\"`);
    console.log("");
    console.log("  2. Upstash QStash dashboard → Events: a published message");
    console.log("     pointing at /api/jobs/process-message.");
    console.log("");
    console.log("  The worker callback won't fire on localhost because QStash");
    console.log("  needs a public URL. Deploy to Vercel to test that hop.");
  } else {
    console.error(`✗ webhook ${res.status}: ${text}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

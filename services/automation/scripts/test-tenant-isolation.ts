/**
 * Cross-tenant isolation test.
 *
 * Proves that data written via `tenantClient(A)` is invisible to
 * `tenantClient(B)`. If this ever fails, isolation is broken — stop the
 * line, do not deploy.
 *
 * What it does:
 *   1. Creates two scratch tenants (A, B) with random phone_number_ids.
 *   2. Through tenantClient(A): inserts a user + conversation + message.
 *   3. Through tenantClient(B): runs the same selects.
 *   4. Asserts B sees zero rows from A's data.
 *   5. Also asserts a bare .from() WITHOUT tenant_id sees both — sanity.
 *   6. Cleans up.
 *
 * Run:
 *   npm run test:tenant-isolation
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import crypto from "node:crypto";

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

const fail = (msg: string) => { console.error(`✗ ${msg}`); process.exit(1); };
const ok   = (msg: string) => console.log(`✓ ${msg}`);

// Import AFTER env is loaded — env.ts validates at import time.
type SupabaseModule = typeof import("../src/core/clients/supabase");
let mod: SupabaseModule;
let sb: ReturnType<SupabaseModule["supabase"]>;

async function createScratchTenant(label: string) {
  const phone = `TEST_${label}_${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await sb
    .from("tenants")
    .insert({
      name: `iso-test-${label}`,
      segment: "salon",
      config: {},
      phone_number_id: phone,
    })
    .select("id, phone_number_id")
    .single();
  if (error) throw new Error(`scratch tenant ${label}: ${error.message}`);
  return data as { id: string; phone_number_id: string };
}

async function deleteTenant(id: string) {
  await sb.from("tenants").delete().eq("id", id);
}

async function main() {
  mod = await import("../src/core/clients/supabase");
  sb = mod.supabase();

  console.log("Creating two scratch tenants…");
  const A = await createScratchTenant("A");
  const B = await createScratchTenant("B");
  ok(`A=${A.id}  B=${B.id}`);

  const tcA = mod.tenantClient(A.id);
  const tcB = mod.tenantClient(B.id);

  try {
    // 1. Insert A's user + conversation + message via tcA.
    const userA = await tcA.from("users").insert({
      wa_id: `iso-A-${Date.now()}`, name: "A-user",
    }).select("id").single();
    if (userA.error) fail(`insert userA: ${userA.error.message}`);

    const convA = await tcA.from("conversations").insert({
      user_id: (userA.data as { id: string }).id, status: "active",
    }).select("id").single();
    if (convA.error) fail(`insert convA: ${convA.error.message}`);

    const msgA = await tcA.from("messages").insert({
      conversation_id: (convA.data as { id: string }).id,
      wa_message_id: `iso-A-${crypto.randomUUID()}`,
      direction: "in", sender_type: "user", content_type: "text",
      text: "hello from A",
    }).select("id").single();
    if (msgA.error) fail(`insert msgA: ${msgA.error.message}`);

    ok("inserted user/conv/msg as A");

    // 2. Through tcB: same selects, expect zero rows.
    const usersAsB = await tcB.from("users").select("id");
    if (usersAsB.error) fail(`select users as B: ${usersAsB.error.message}`);
    const usersAsBCount = (usersAsB.data ?? []).length;
    if (usersAsBCount !== 0) fail(`B sees ${usersAsBCount} users (expected 0) — LEAK`);
    ok("B sees zero users");

    const convsAsB = await tcB.from("conversations").select("id");
    if (convsAsB.error) fail(`select convs as B: ${convsAsB.error.message}`);
    if ((convsAsB.data ?? []).length !== 0) fail(`B sees ${(convsAsB.data ?? []).length} conversations — LEAK`);
    ok("B sees zero conversations");

    const msgsAsB = await tcB.from("messages").select("id");
    if (msgsAsB.error) fail(`select msgs as B: ${msgsAsB.error.message}`);
    if ((msgsAsB.data ?? []).length !== 0) fail(`B sees ${(msgsAsB.data ?? []).length} messages — LEAK`);
    ok("B sees zero messages");

    // 3. Verify A can still see A's data.
    const usersAsA = await tcA.from("users").select("id");
    if ((usersAsA.data ?? []).length === 0) fail("A sees zero users — wrapper too aggressive?");
    ok(`A sees ${(usersAsA.data ?? []).length} of its users`);

    // 4. Sanity: raw client (admin) sees both rows.
    const allUsers = await sb.from("users").select("id, tenant_id")
      .in("tenant_id", [A.id, B.id]);
    if (allUsers.error) fail(`raw select: ${allUsers.error.message}`);
    if ((allUsers.data ?? []).length !== 1) fail(`raw client sees ${(allUsers.data ?? []).length} test users (expected 1)`);
    ok("raw client sees the row (escape hatch works)");

    // 5. Tenant-id injection on insert: prove wrapper overrides a wrong id.
    const sneak = await tcB.from("users").insert({
      wa_id: `iso-sneak-${Date.now()}`, name: "sneak",
      tenant_id: A.id, // attempt to write into A from tcB
    }).select("tenant_id").single();
    if (sneak.error) fail(`sneak insert: ${sneak.error.message}`);
    const writtenTenant = (sneak.data as { tenant_id: string }).tenant_id;
    if (writtenTenant !== B.id) fail(`wrapper let a foreign tenant_id through: wrote ${writtenTenant}, expected ${B.id}`);
    ok("wrapper overrides caller-supplied tenant_id");

    console.log("");
    console.log("All isolation assertions passed.");
  } finally {
    console.log("");
    console.log("Cleaning up scratch tenants…");
    // CASCADE on tenants → wipes users → wipes conversations → wipes messages.
    await deleteTenant(A.id);
    await deleteTenant(B.id);
    ok("cleaned up");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

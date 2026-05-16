/**
 * Server-side Supabase clients (service role — bypasses RLS).
 * NEVER import from anywhere that ships to the browser.
 *
 * Two doors into the database:
 *
 *   supabase()              — raw client. Use ONLY for non-tenant tables
 *                             (tenants) and admin operations. Never for
 *                             messaging data.
 *
 *   tenantClient(tenantId)  — tenant-scoped client. Every read auto-filters
 *                             by tenant_id; every insert/upsert auto-injects
 *                             tenant_id. This is the single seam where tenant
 *                             isolation is enforced in app code — because the
 *                             service role bypasses RLS, forgetting a manual
 *                             `.eq('tenant_id', ...)` would silently leak.
 *
 * If you find yourself calling supabase() from messaging code, you almost
 * certainly want tenantClient() instead.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/core/config/env";

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });
  return _client;
}

export type TenantClient = ReturnType<typeof tenantClient>;

type Row = Record<string, unknown>;

export function tenantClient(tenantId: string) {
  if (!tenantId) throw new Error("tenantClient: tenantId required");
  const sb = supabase();

  const withTenant = (rows: Row | Row[]): Row | Row[] =>
    Array.isArray(rows)
      ? rows.map((r) => ({ ...r, tenant_id: tenantId }))
      : { ...rows, tenant_id: tenantId };

  return {
    tenantId,

    /** Escape hatch for admin/cross-tenant ops. Use deliberately. */
    raw: sb,

    from(table: string) {
      const t = () => sb.from(table);
      return {
        select(columns: string = "*") {
          return t().select(columns).eq("tenant_id", tenantId);
        },
        insert(rows: Row | Row[]) {
          return t().insert(withTenant(rows) as Row);
        },
        upsert(
          rows: Row | Row[],
          opts?: Parameters<ReturnType<typeof sb.from>["upsert"]>[1],
        ) {
          return t().upsert(withTenant(rows) as Row, opts);
        },
        update(patch: Row) {
          return t().update(patch).eq("tenant_id", tenantId);
        },
        delete() {
          return t().delete().eq("tenant_id", tenantId);
        },
      };
    },
  };
}

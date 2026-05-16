/**
 * Conversation service — find-or-create a user + their active conversation.
 *
 * One active conversation per (tenant, user). Closing or escalating is
 * tracked via `status`; the next inbound message reopens or creates a new one.
 *
 * Every call takes a `TenantClient` so the underlying queries are tenant-
 * scoped by construction. Do not introduce a `tenantId: string` overload —
 * the wrapper is the seam that prevents cross-tenant bleed.
 */
import type { TenantClient } from "@/core/clients/supabase";

export type User = {
  id: string;
  tenant_id: string;
  wa_id: string;
  name: string | null;
};

export type Conversation = {
  id: string;
  tenant_id: string;
  user_id: string;
  status: "active" | "idle" | "closed" | "human";
  current_agent: string | null;
  summary: string | null;
};

export async function upsertUser(
  tc: TenantClient,
  input: { waId: string; name?: string | null },
): Promise<User> {
  const { data, error } = await tc
    .from("users")
    .upsert(
      {
        wa_id: input.waId,
        name: input.name ?? null,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "tenant_id,wa_id" },
    )
    .select("id, tenant_id, wa_id, name")
    .single();
  if (error) throw error;
  return data as unknown as User;
}

export async function getOrCreateActiveConversation(
  tc: TenantClient,
  user: User,
): Promise<Conversation> {
  const existing = await tc
    .from("conversations")
    .select("id, tenant_id, user_id, status, current_agent, summary")
    .eq("user_id", user.id)
    .in("status", ["active", "idle"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as unknown as Conversation;

  const created = await tc
    .from("conversations")
    .insert({ user_id: user.id, status: "active" })
    .select("id, tenant_id, user_id, status, current_agent, summary")
    .single();

  if (created.error) throw created.error;
  return created.data as unknown as Conversation;
}

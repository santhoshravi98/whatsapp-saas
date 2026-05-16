/**
 * Tenant resolver.
 *
 * Looks up a tenant by the Meta phone-number-id that arrives on every webhook
 * payload at `entry[0].changes[0].value.metadata.phone_number_id`. There is
 * one tenant per phone_number_id; unknown numbers are rejected loudly.
 *
 * To onboard a new tenant:
 *   1. INSERT into tenants (name, segment, config, phone_number_id).
 *   2. Register the same phone_number_id with Meta against your WhatsApp app.
 *   3. No code changes needed — this resolver picks it up automatically.
 */
import { supabase } from "@/core/clients/supabase";
import type { Tenant, SegmentName } from "./types";

export type { Tenant, SegmentName } from "./types";

export class UnknownTenantError extends Error {
  constructor(public readonly phoneNumberId: string) {
    super(`Unknown tenant for phone_number_id=${phoneNumberId}`);
    this.name = "UnknownTenantError";
  }
}

export async function resolveTenant(phoneNumberId: string): Promise<Tenant> {
  if (!phoneNumberId) {
    throw new Error("resolveTenant: phone_number_id is required");
  }

  const { data, error } = await supabase()
    .from("tenants")
    .select("id, name, segment, config")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (error) throw new Error(`Tenant lookup failed: ${error.message}`);
  if (!data) throw new UnknownTenantError(phoneNumberId);

  return {
    id: data.id as string,
    name: data.name as string,
    segment: (data.segment ?? "salon") as SegmentName,
    config: (data.config ?? {}) as Record<string, unknown>,
  };
}

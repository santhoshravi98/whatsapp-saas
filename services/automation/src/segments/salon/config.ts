/**
 * Salon tenant.config schema.
 *
 * Stored as JSONB in `tenants.config`. Every salon tenant gets its own values
 * — never hard-code business details in TS.
 */
import { z } from "zod";

export const SalonConfigSchema = z.object({
  displayName: z.string().default("the salon"),
  hours:       z.string().default("by appointment"),
  address:     z.string().default(""),
  bookingLink: z.string().url().nullable().optional(),
  services:    z.array(z.string()).optional(),       // e.g. ["haircut", "colour", "facial"]
});

export type SalonConfig = z.infer<typeof SalonConfigSchema>;

export function parseSalonConfig(raw: Record<string, unknown>): SalonConfig {
  return SalonConfigSchema.parse(raw);
}

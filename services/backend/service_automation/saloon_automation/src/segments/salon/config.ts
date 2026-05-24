/**
 * Salon tenant.config schema.
 *
 * Stored as JSONB in `tenants.config`. Every salon tenant gets its own values
 * — never hard-code business details in TS.
 *
 * Parsing failures never throw: a misconfigured tenant degrades to safe
 * defaults so a bad seed doesn't take the whole webhook pipeline down.
 * The corruption is logged with the tenant id for an operator to chase.
 */
import { z } from "zod";
import { logger } from "@/core/logger";

const ServiceItemSchema = z.union([
  z.string(),
  z.object({
    id:          z.string().min(1),
    title:       z.string().min(1),
    description: z.string().optional(),
    /**
     * Optional category, used to GROUP services into list sections on the
     * service picker. Items without a category land in a default "Services"
     * section. Suggested values: "Hair", "Skin", "Nails", "Special".
     */
    category:    z.string().max(24).optional(),
    /**
     * Optional price range shown in the list row description.
     * Free text (e.g. "₹600–900", "$40+", "from £25"). When set, the agent
     * is allowed to quote this range — see the salon prompt's pricing rule.
     * Capped at 24 chars to fit alongside the duration in a list row desc.
     */
    priceRange:  z.string().max(24).optional(),
  }),
]);

export const SalonConfigSchema = z.object({
  displayName:    z.string().default("the salon"),
  hours:          z.string().default("by appointment"),
  address:        z.string().default(""),
  bookingLink:    z.string().url().nullable().optional(),
  services:       z.array(ServiceItemSchema).optional(),
  timezone:       z.string().optional(),
  outboundRateLimitPerMin: z.number().int().nonnegative().nullable().optional(),
  slots:          z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(3).optional(),
  bookingDays:    z.number().int().min(1).max(10).default(7),
  /**
   * Weekdays (0=Sun … 6=Sat) when the salon is closed. The date picker
   * skips these so we never offer a closed day. The catalogue still emits
   * `bookingDays` rows total — it just walks the calendar past closures.
   */
  closedWeekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  /** Operator's WhatsApp number (digits only, with country code, no `+`). */
  ownerWaId:      z.string().regex(/^\d{6,15}$/).optional(),
  ownerName:      z.string().max(40).optional(),
});

export type SalonConfig = z.infer<typeof SalonConfigSchema>;

const SAFE_DEFAULTS: SalonConfig = {
  displayName: "the salon",
  hours: "by appointment",
  address: "",
  bookingDays: 7,
};

export function parseSalonConfig(
  raw: Record<string, unknown>,
  tenantId?: string,
): SalonConfig {
  const result = SalonConfigSchema.safeParse(raw);
  if (result.success) return result.data;
  logger.error("salon_config_invalid", {
    tenantId,
    issues: result.error.flatten().fieldErrors,
  });
  return SAFE_DEFAULTS;
}

export type SalonServiceRow = {
  id: string;
  title: string;
  description?: string;
  category?: string;
};

/**
 * Normalize the loose service config into id/title rows. Price ranges (if
 * configured) are appended to the description so the customer sees them
 * inline in the list row.
 */
export function servicesAsRows(cfg: SalonConfig): SalonServiceRow[] {
  const items = cfg.services ?? [];
  return items.map((item, i) => {
    if (typeof item === "string") {
      return { id: slugify(item) || `svc_${i}`, title: item.slice(0, 24) };
    }
    const row: SalonServiceRow = {
      id: item.id,
      title: item.title.slice(0, 24),
    };
    const descParts: string[] = [];
    if (item.priceRange) descParts.push(item.priceRange);
    if (item.description) descParts.push(item.description);
    if (descParts.length) {
      row.description = descParts.join(" · ").slice(0, 72);
    }
    if (item.category) row.category = item.category;
    return row;
  }).slice(0, 10);
}

/**
 * Group services into list sections by `category`. Items without a category
 * are bucketed under "Services". Section order follows first-appearance in
 * the config so operators control the layout by ordering services[].
 */
export function servicesAsSections(cfg: SalonConfig): Array<{
  title: string;
  rows: SalonServiceRow[];
}> {
  const rows = servicesAsRows(cfg);
  const buckets = new Map<string, SalonServiceRow[]>();
  for (const r of rows) {
    const key = r.category ?? "Services";
    const bucket = buckets.get(key) ?? [];
    bucket.push(r);
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries()).map(([title, sectionRows]) => ({
    title: title.slice(0, 24),
    rows: sectionRows,
  }));
}

/** True if the salon has at least one service with a non-empty priceRange. */
export function hasAnyPriceRange(cfg: SalonConfig): boolean {
  for (const item of cfg.services ?? []) {
    if (typeof item === "object" && item.priceRange) return true;
  }
  return false;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

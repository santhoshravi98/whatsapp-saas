/**
 * Tenant types.
 *
 * `segment` chooses which module under `src/segments/` handles this tenant.
 * `config` is a free-form JSONB blob — each segment validates its own shape.
 */
export type SegmentName = "salon" | "restaurant" | "clinic" | "retail";

export type Tenant = {
  id: string;
  name: string;
  segment: SegmentName;
  /**
   * Segment-specific configuration. Validated by the segment, NOT by core.
   * Example for salon: { hours, address, services: [...] }
   */
  config: Record<string, unknown>;
};

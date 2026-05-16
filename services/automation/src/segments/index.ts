/**
 * Segment registry.
 *
 * Adding a new vertical = adding one import + one entry to REGISTRY.
 * Everything else (webhook, worker, messaging) is segment-agnostic.
 */
import type { SegmentName } from "@/core/tenants/types";
import type { Segment } from "./types";
import { salonSegment } from "./salon";

const REGISTRY: Record<SegmentName, Segment | undefined> = {
  salon: salonSegment,
  // restaurant: restaurantSegment,
  // clinic: clinicSegment,
  // retail: retailSegment,
  restaurant: undefined,
  clinic: undefined,
  retail: undefined,
};

export function getSegment(name: SegmentName): Segment {
  const seg = REGISTRY[name];
  if (!seg) throw new Error(`Segment not implemented: ${name}`);
  return seg;
}

export type { Segment, SegmentContext, ReplyHookResult } from "./types";

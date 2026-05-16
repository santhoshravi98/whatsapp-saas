/**
 * Salon booking capture.
 *
 * The agent emits a `[BOOKING_REQUEST] ...` line — see `prompt.ts`. We strip
 * that line from the user-facing reply and persist a row to `bookings`.
 */
import type { TenantClient } from "@/core/clients/supabase";
import { logger } from "@/core/logger";
import { BOOKING_MARKER } from "./prompt";

export type ParsedBooking = {
  name: string;
  service: string;
  date: string | null;     // YYYY-MM-DD or null when "flexible"
  time: string | null;     // HH:MM or null when "flexible"
  notes: string | null;
};

export function extractBooking(replyText: string): {
  cleanText: string;
  booking: ParsedBooking | null;
} {
  const idx = replyText.indexOf(BOOKING_MARKER);
  if (idx === -1) return { cleanText: replyText, booking: null };

  const lineEnd = replyText.indexOf("\n", idx);
  const markerLine =
    lineEnd === -1 ? replyText.slice(idx) : replyText.slice(idx, lineEnd);
  const cleanText = (
    replyText.slice(0, idx) +
    (lineEnd === -1 ? "" : replyText.slice(lineEnd + 1))
  ).trim();

  const fields = parseKvLine(markerLine.slice(BOOKING_MARKER.length).trim());
  const name = fields.name?.trim();
  const service = fields.service?.trim();
  if (!name || !service) {
    logger.warn("salon_booking_marker_missing_fields", { markerLine });
    return { cleanText, booking: null };
  }

  return {
    cleanText,
    booking: {
      name,
      service,
      date: normalizeDate(fields.date),
      time: normalizeTime(fields.time),
      notes: fields.notes?.trim() || null,
    },
  };
}

export async function recordBooking(
  tc: TenantClient,
  input: {
    userId: string;
    conversationId: string;
    booking: ParsedBooking;
  },
): Promise<void> {
  const { error } = await tc.from("bookings").insert({
    user_id: input.userId,
    conversation_id: input.conversationId,
    customer_name: input.booking.name,
    service: input.booking.service,
    preferred_date: input.booking.date,
    preferred_time: input.booking.time,
    notes: input.booking.notes,
  });
  if (error) throw error;
}

// ─── helpers ────────────────────────────────────────────────────────────────
function parseKvLine(line: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const segment of line.split(";")) {
    const eq = segment.indexOf("=");
    if (eq === -1) continue;
    const key = segment.slice(0, eq).trim();
    const value = segment.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

function normalizeDate(v: string | undefined): string | null {
  if (!v || v.toLowerCase() === "flexible") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function normalizeTime(v: string | undefined): string | null {
  if (!v || v.toLowerCase() === "flexible") return null;
  return /^\d{2}:\d{2}$/.test(v) ? v : null;
}

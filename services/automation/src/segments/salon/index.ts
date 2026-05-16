/**
 * Salon segment.
 *
 * Composes the salon-specific pieces (config schema, system prompt, booking
 * capture) into a single `Segment` registered in `src/segments/index.ts`.
 */
import { logger } from "@/core/logger";
import type { Segment, SegmentContext, ReplyHookResult } from "../types";
import { parseSalonConfig } from "./config";
import { buildSalonSystemPrompt } from "./prompt";
import { extractBooking, recordBooking } from "./bookings";

export const salonSegment: Segment = {
  name: "salon",

  buildSystemPrompt(ctx: SegmentContext): string {
    const cfg = parseSalonConfig(ctx.tenant.config);
    return buildSalonSystemPrompt(cfg);
  },

  async onAgentReply(ctx: SegmentContext, replyText: string): Promise<ReplyHookResult> {
    const { cleanText, booking } = extractBooking(replyText);
    if (booking) {
      try {
        await recordBooking(ctx.tc, {
          userId: ctx.user.id,
          conversationId: ctx.conversation.id,
          booking,
        });
        logger.info("salon_booking_captured", {
          conversationId: ctx.conversation.id,
          service: booking.service,
        });
      } catch (err) {
        // Never block the reply over a booking insert failure — log + move on.
        logger.error("salon_booking_insert_failed", {
          conversationId: ctx.conversation.id,
          error: (err as Error).message,
        });
      }
    }
    return { cleanText };
  },
};

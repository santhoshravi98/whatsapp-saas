/**
 * Segment contract.
 *
 * A "segment" is a vertical (salon, restaurant, clinic, retail, …). One
 * codebase, many segments — each tenant picks one via `tenants.segment`.
 *
 * Implement this interface to add a new vertical:
 *   1. Create `src/segments/<name>/index.ts` exporting a `Segment` object.
 *   2. Register it in `src/segments/index.ts`.
 *   3. Add the name to the CHECK constraint in tenants migration.
 *   4. (Optional) Add segment-specific tables under supabase/migrations/.
 *
 * Keep the surface small. If a segment needs more than `buildSystemPrompt`
 * + `onAgentReply`, add a capability to this interface only after a second
 * segment also needs it.
 */
import type { ChatMessage } from "@/core/clients/claude";
import type { TenantClient } from "@/core/clients/supabase";
import type { Tenant } from "@/core/tenants/types";

export type SegmentContext = {
  tenant: Tenant;
  /** Tenant-scoped Supabase client. Use this for all DB writes in segment code. */
  tc: TenantClient;
  user: { id: string; name: string | null; waId: string };
  conversation: { id: string };
};

export type AgentRunInput = {
  history: ChatMessage[];
  userMessage: string;
};

export type AgentRunResult = {
  text: string;
  usage?: Record<string, unknown>;
};

export type ReplyHookResult = {
  /** Text actually sent to WhatsApp (markers stripped, etc.). */
  cleanText: string;
};

export interface Segment {
  readonly name: string;

  /**
   * Build the system prompt for this tenant. Called once per inbound message.
   * Read everything you need from `ctx.tenant.config`.
   */
  buildSystemPrompt(ctx: SegmentContext): string;

  /**
   * Optional post-processing hook. Use this to:
   *   - extract structured data from the reply (e.g. booking markers)
   *   - strip those markers from the text that gets sent to the user
   *   - persist segment-specific rows (bookings, orders, leads, ...)
   *
   * If not implemented, the raw agent reply is sent verbatim.
   */
  onAgentReply?(ctx: SegmentContext, replyText: string): Promise<ReplyHookResult>;
}

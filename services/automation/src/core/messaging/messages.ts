/**
 * Messages service — read history, append inbound, append outbound.
 *
 * History is what we hand to the agent. Default window is 20 turns; expand
 * with a rolling summary in `conversations.summary` when chats grow long.
 *
 * All queries go through `TenantClient` — see `clients/supabase.ts` for why.
 */
import type { TenantClient } from "@/core/clients/supabase";
import type { ChatMessage } from "@/core/clients/claude";

const DEFAULT_HISTORY_TURNS = 20;

export async function recordInboundText(
  tc: TenantClient,
  input: { conversationId: string; waMessageId: string; text: string },
): Promise<void> {
  const { error } = await tc
    .from("messages")
    .upsert(
      {
        conversation_id: input.conversationId,
        wa_message_id: input.waMessageId,
        direction: "in",
        sender_type: "user",
        content_type: "text",
        text: input.text,
        status: "delivered",
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function recordOutboundText(
  tc: TenantClient,
  input: {
    conversationId: string;
    waMessageId: string;
    text: string;
    agentName: string;
  },
): Promise<void> {
  const { error } = await tc.from("messages").insert({
    conversation_id: input.conversationId,
    wa_message_id: input.waMessageId,
    direction: "out",
    sender_type: "agent",
    content_type: "text",
    text: input.text,
    status: "sent",
    meta: { agent: input.agentName },
  });
  if (error) throw error;
}

export async function loadHistory(
  tc: TenantClient,
  conversationId: string,
  turns: number = DEFAULT_HISTORY_TURNS,
): Promise<ChatMessage[]> {
  const { data, error } = await tc
    .from("messages")
    .select("direction, text, created_at")
    .eq("conversation_id", conversationId)
    .eq("content_type", "text")
    .order("created_at", { ascending: false })
    .limit(turns);

  if (error) throw error;

  type Row = { direction: "in" | "out"; text: string | null; created_at: string };
  const rows = ((data ?? []) as unknown as Row[]).slice().reverse();
  return rows
    .filter((m): m is Row & { text: string } =>
      typeof m.text === "string" && m.text.length > 0,
    )
    .map((m) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.text,
    }));
}

/**
 * Anthropic Claude client. One shared SDK instance.
 *
 * Prompt caching is enabled on the system block — a stable system prompt
 * becomes ~90% cheaper on repeat calls once it exceeds the cache threshold.
 */
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/core/config/env";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _client;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type CompleteParams = {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  model?: string;
};

export type CompleteResult = {
  text: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};

export async function complete(params: CompleteParams): Promise<CompleteResult> {
  const res = await client().messages.create({
    model: params.model ?? env.ANTHROPIC_MODEL,
    max_tokens: params.maxTokens ?? 1024,
    system: [
      {
        type: "text",
        text: params.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const first = res.content[0];
  const text = first && first.type === "text" ? first.text : "";

  return {
    text,
    usage: {
      input_tokens: res.usage.input_tokens,
      output_tokens: res.usage.output_tokens,
      cache_read_input_tokens: res.usage.cache_read_input_tokens ?? undefined,
      cache_creation_input_tokens: res.usage.cache_creation_input_tokens ?? undefined,
    },
  };
}

/**
 * Anthropic Claude client. One shared SDK instance.
 *
 * Resilience layer:
 *   - Exponential backoff with jitter for 429 / 5xx / overload.
 *   - One-shot fallback to `ANTHROPIC_FALLBACK_MODEL` after retries on the
 *     primary are exhausted. The fallback gets a single attempt — if it also
 *     fails we let the error bubble so QStash retries the job from the top.
 *
 * Prompt caching is enabled on the system block — a stable system prompt
 * becomes ~90% cheaper on repeat calls once it exceeds the cache threshold.
 */
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/core/config/env";
import { logger } from "@/core/logger";

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

export type CompleteUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  total_billable_tokens: number;
};

export type CompleteResult = {
  text: string;
  model: string;
  usage: CompleteUsage;
};

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 400;

export async function complete(params: CompleteParams): Promise<CompleteResult> {
  const primary = params.model ?? env.ANTHROPIC_MODEL;
  try {
    return await callWithRetry(primary, params);
  } catch (err) {
    if (!shouldFallback(err) || env.ANTHROPIC_FALLBACK_MODEL === primary) {
      throw err;
    }
    logger.warn("claude_primary_exhausted_falling_back", {
      primary,
      fallback: env.ANTHROPIC_FALLBACK_MODEL,
      error: (err as Error).message,
    });
    // Fallback gets a single attempt — don't double-spend the user's budget.
    return await callOnce(env.ANTHROPIC_FALLBACK_MODEL, params);
  }
}

async function callWithRetry(model: string, params: CompleteParams): Promise<CompleteResult> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callOnce(model, params);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break;
      const backoff = BASE_DELAY_MS * 2 ** (attempt - 1);
      const jitter = Math.random() * backoff;
      const delay = Math.floor(backoff + jitter);
      logger.warn("claude_retry", {
        model,
        attempt,
        nextDelayMs: delay,
        error: (err as Error).message,
      });
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function callOnce(model: string, params: CompleteParams): Promise<CompleteResult> {
  const res = await client().messages.create({
    model,
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

  const usage: CompleteUsage = {
    input_tokens: res.usage.input_tokens,
    output_tokens: res.usage.output_tokens,
    cache_read_input_tokens: res.usage.cache_read_input_tokens ?? undefined,
    cache_creation_input_tokens: res.usage.cache_creation_input_tokens ?? undefined,
    total_billable_tokens:
      res.usage.input_tokens +
      res.usage.output_tokens +
      (res.usage.cache_creation_input_tokens ?? 0),
  };

  return { text, model, usage };
}

function isRetryable(err: unknown): boolean {
  // Anthropic SDK exposes `.status` on APIError. Retry on 408/409/429/5xx.
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { statusCode?: number }).statusCode;
  if (typeof status === "number") {
    if (status === 408 || status === 409 || status === 429) return true;
    if (status >= 500 && status < 600) return true;
    return false;
  }
  // Network errors (fetch failures, ECONNRESET) — no status on the error.
  const msg = (err as Error)?.message ?? "";
  return /timeout|ECONN|EAI_AGAIN|fetch failed|overload/i.test(msg);
}

function shouldFallback(err: unknown): boolean {
  // We've already exhausted retries on the primary. Any retryable error or
  // a 529 (overload) is worth one fallback shot.
  const status = (err as { status?: number }).status;
  if (status === 529) return true;
  return isRetryable(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

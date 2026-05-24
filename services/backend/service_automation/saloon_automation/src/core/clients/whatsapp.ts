/**
 * WhatsApp Cloud API client.
 *
 * Surface area kept minimal on purpose — extend with image/template helpers
 * as features land. The rest of the codebase should not depend on Meta's
 * payload shape.
 *
 * Outbound shapes supported here:
 *   - sendText:            plain text
 *   - sendButtons:         1–3 reply buttons (Meta's "interactive button" type)
 *   - sendList:            sectioned list, up to 10 rows total ("interactive list")
 *
 * All send helpers return `{ wa_message_id }`; the processor uses that as the
 * idempotency key when patching the outbound row.
 */
import { env } from "@/core/config/env";
import { logger } from "@/core/logger";

const GRAPH_BASE = "https://graph.facebook.com";

type SendResult = { wa_message_id: string };

function messagesUrl(): string {
  return `${GRAPH_BASE}/${env.META_GRAPH_API_VERSION}/${env.META_PHONE_NUMBER_ID}/messages`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function postMessage(body: Record<string, unknown>, action: string): Promise<SendResult> {
  const res = await fetch(messagesUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    logger.error("whatsapp_send_failed", { action, status: res.status, body: errText });
    throw new Error(`WhatsApp ${action} failed (${res.status}): ${errText}`);
  }
  const data = (await res.json()) as { messages?: Array<{ id?: string }> };
  const id = data.messages?.[0]?.id;
  if (!id) throw new Error(`WhatsApp ${action}: no message id returned`);
  return { wa_message_id: id };
}

export async function sendText(to: string, body: string): Promise<SendResult> {
  return postMessage(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    },
    "send_text",
  );
}

// ─── interactive payloads ───────────────────────────────────────────────────

export type ButtonsPayload = {
  body: string;
  /** 1–3. Each `title` is shown on the button (max 20 chars per Meta). */
  buttons: Array<{ id: string; title: string }>;
  /** Optional small header text shown above the body. Max 60 chars. */
  header?: string;
  /** Optional small footer text shown under the buttons. Max 60 chars. */
  footer?: string;
};

export type ListPayload = {
  body: string;
  /** The CTA on the dropdown the user taps to expand the list. Max 20 chars. */
  buttonText: string;
  sections: Array<{
    /** Optional — Meta requires it only when there are 2+ sections. */
    title?: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
  header?: string;
  footer?: string;
};

export async function sendButtons(to: string, p: ButtonsPayload): Promise<SendResult> {
  if (p.buttons.length === 0 || p.buttons.length > 3) {
    throw new Error(`sendButtons: buttons must be 1–3, got ${p.buttons.length}`);
  }
  const interactive: Record<string, unknown> = {
    type: "button",
    body: { text: p.body },
    action: {
      buttons: p.buttons.map((b) => ({
        type: "reply",
        reply: { id: b.id, title: b.title },
      })),
    },
  };
  if (p.header) interactive.header = { type: "text", text: p.header };
  if (p.footer) interactive.footer = { text: p.footer };

  return postMessage(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive,
    },
    "send_buttons",
  );
}

export async function sendList(to: string, p: ListPayload): Promise<SendResult> {
  const totalRows = p.sections.reduce((n, s) => n + s.rows.length, 0);
  if (totalRows === 0 || totalRows > 10) {
    throw new Error(`sendList: total rows must be 1–10, got ${totalRows}`);
  }
  const interactive: Record<string, unknown> = {
    type: "list",
    body: { text: p.body },
    action: {
      button: p.buttonText,
      sections: p.sections.map((s) => ({
        ...(s.title ? { title: s.title } : {}),
        rows: s.rows.map((r) => ({
          id: r.id,
          title: r.title,
          ...(r.description ? { description: r.description } : {}),
        })),
      })),
    },
  };
  if (p.header) interactive.header = { type: "text", text: p.header };
  if (p.footer) interactive.footer = { text: p.footer };

  return postMessage(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive,
    },
    "send_list",
  );
}

/**
 * Mark an inbound message as read (blue ticks for the customer) and
 * optionally show the typing indicator while we generate a reply.
 *
 * Meta combines both into a single API call. The typing indicator hides
 * automatically when we send the outbound reply, or after ~25 seconds.
 *
 * Never throws — read receipts and typing dots are nice-to-haves; a failure
 * here must not block the agent reply pipeline. We log and move on.
 */
export async function markRead(
  messageId: string,
  opts: { showTyping?: boolean } = {},
): Promise<void> {
  try {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };
    if (opts.showTyping) {
      body.typing_indicator = { type: "text" };
    }

    const res = await fetch(messagesUrl(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn("whatsapp_mark_read_failed", {
        status: res.status,
        body: errText,
        showTyping: !!opts.showTyping,
      });
    }
  } catch (err) {
    logger.warn("whatsapp_mark_read_threw", {
      error: (err as Error).message,
    });
  }
}

/**
 * Minimal structured logger. JSON to stdout — Vercel ingests this into Logs.
 *
 * The active RequestContext (requestId / tenantId / eventId) is auto-merged
 * into every entry so a single inbound message is greppable end-to-end.
 */
import { getContext } from "./context";

type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const ctx = getContext();
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
    ...(ctx?.tenantId ? { tenantId: ctx.tenantId } : {}),
    ...(ctx?.eventId  ? { eventId:  ctx.eventId  } : {}),
    ...fields,
  };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => log("debug", msg, fields),
  info:  (msg: string, fields?: Record<string, unknown>) => log("info", msg, fields),
  warn:  (msg: string, fields?: Record<string, unknown>) => log("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => log("error", msg, fields),
};

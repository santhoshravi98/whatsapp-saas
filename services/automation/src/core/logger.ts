/**
 * Minimal structured logger. JSON to stdout — Vercel ingests this into Logs.
 * Use sparingly; Sentry handles errors, this is for traceable info events.
 */
type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const entry = { level, msg, ts: new Date().toISOString(), ...fields };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => log("debug", msg, fields),
  info:  (msg: string, fields?: Record<string, unknown>) => log("info", msg, fields),
  warn:  (msg: string, fields?: Record<string, unknown>) => log("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => log("error", msg, fields),
};

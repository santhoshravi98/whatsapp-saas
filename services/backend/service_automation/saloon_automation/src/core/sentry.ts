/**
 * Sentry helper — one place to call from app code so we don't sprinkle SDK
 * imports throughout. If SENTRY_DSN is unset (dev), the calls become no-ops.
 *
 * Init lives in sentry.{server,edge}.config.ts (Next.js convention); this
 * module only handles capture and breadcrumb plumbing at runtime.
 */
import * as Sentry from "@sentry/nextjs";
import { getContext } from "./context";
import { env } from "./config/env";

function enabled(): boolean {
  return !!env.SENTRY_DSN;
}

export function captureException(err: unknown, extra?: Record<string, unknown>): void {
  if (!enabled()) return;
  const ctx = getContext();
  Sentry.withScope((scope) => {
    if (ctx?.requestId) scope.setTag("requestId", ctx.requestId);
    if (ctx?.tenantId)  scope.setTag("tenantId",  ctx.tenantId);
    if (ctx?.eventId)   scope.setTag("eventId",   ctx.eventId);
    if (extra) scope.setExtras(extra);
    Sentry.captureException(err);
  });
}

export function captureMessage(msg: string, level: "info" | "warning" | "error" = "info", extra?: Record<string, unknown>): void {
  if (!enabled()) return;
  const ctx = getContext();
  Sentry.withScope((scope) => {
    if (ctx?.requestId) scope.setTag("requestId", ctx.requestId);
    if (ctx?.tenantId)  scope.setTag("tenantId",  ctx.tenantId);
    if (ctx?.eventId)   scope.setTag("eventId",   ctx.eventId);
    if (extra) scope.setExtras(extra);
    Sentry.captureMessage(msg, level);
  });
}

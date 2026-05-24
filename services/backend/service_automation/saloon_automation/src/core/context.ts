/**
 * Per-request context propagated through async work via AsyncLocalStorage.
 *
 * Every webhook / job invocation seeds this once with a fresh `requestId`;
 * everything downstream (logger, Sentry breadcrumbs, QStash headers) pulls
 * from here instead of threading the id through every function signature.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";

export type RequestContext = {
  requestId: string;
  tenantId?: string;
  eventId?: string;
};

const als = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext | undefined {
  return als.getStore();
}

export function getRequestId(): string | undefined {
  return als.getStore()?.requestId;
}

export function runWithContext<T>(ctx: Partial<RequestContext>, fn: () => Promise<T> | T): Promise<T> | T {
  const existing = als.getStore();
  const next: RequestContext = {
    requestId: ctx.requestId ?? existing?.requestId ?? crypto.randomUUID(),
    tenantId: ctx.tenantId ?? existing?.tenantId,
    eventId: ctx.eventId ?? existing?.eventId,
  };
  return als.run(next, fn);
}

/**
 * Mutate fields on the active context. Callable any time after `runWithContext`
 * starts — e.g. once the processor resolves the tenant_id.
 */
export function setContext(patch: Partial<RequestContext>): void {
  const cur = als.getStore();
  if (!cur) return;
  if (patch.tenantId !== undefined) cur.tenantId = patch.tenantId;
  if (patch.eventId !== undefined) cur.eventId = patch.eventId;
}

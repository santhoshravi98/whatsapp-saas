/**
 * Sentry — Node.js runtime (server-side route handlers).
 * Loaded automatically by @sentry/nextjs on cold start.
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    // We capture errors explicitly via core/sentry.ts; disable default
    // unhandled-rejection capture to avoid double reporting from our
    // route handlers that already re-throw.
    defaultIntegrations: false,
  });
}

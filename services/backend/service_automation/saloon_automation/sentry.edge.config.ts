/**
 * Sentry — Edge runtime. We don't currently run anything in edge but Next.js
 * will warn if this file is missing alongside sentry.server.config.ts.
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0,
  });
}

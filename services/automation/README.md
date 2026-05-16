# @whatsapp-saas/automation

WhatsApp + Claude agent service. Ingests WhatsApp webhooks, runs Claude-powered conversation logic per tenant segment (e.g. `salon`), and dispatches outbound messages via QStash.

## Layout

```
src/
  app/           Next.js App Router routes (webhook, health, job processors)
  core/
    clients/     Third-party clients (whatsapp, claude, supabase, qstash)
    config/      Env parsing/validation
    messaging/   Conversation/message persistence, webhook event handling, processor
    tenants/     Tenant lookup and types
    crypto.ts    HMAC verification helpers
    logger.ts    Structured logger
  segments/      Per-vertical agent logic (salon, ...)
scripts/         Operational scripts (config check, smoke test, backfills)
```

## Develop

```bash
pnpm --filter @whatsapp-saas/automation dev
```

Env vars: copy `.env.example` to `.env.local` and fill in.

## Related

- Root `supabase/migrations` — shared DB schema
- Root `infrastructure/terraform` — Cloudflare/Vercel infra
- Root `docs/` — architecture, runbook, setup

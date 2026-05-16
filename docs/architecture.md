# Architecture

## Diagram

```
   Meta WhatsApp Cloud API
            │  (webhook, must ACK in <5s)
            ▼
   ┌────────────────────────────────────┐
   │  Vercel — Next.js                  │
   │                                    │
   │  POST /api/webhook                 │
   │    verify HMAC → record raw → enqueue → 200 OK
   │                                    │
   │  POST /api/jobs/process-message    │
   │    verify QStash sig               │
   │    → resolveTenant()               │──► Supabase
   │    → getSegment(tenant.segment)    │
   │    → segment.buildSystemPrompt()   │
   │    → Claude.complete()             │──► Anthropic
   │    → segment.onAgentReply()        │──► Supabase (segment tables)
   │    → WhatsApp.sendText()           │──► Meta
   │    → mark processed                │
   └────────────────────────────────────┘
```

## Layout

```
src/
├── app/api/                  Next.js routes (thin wiring)
│   ├── webhook/              Fast-ACK webhook receiver
│   ├── jobs/process-message/ QStash-driven worker
│   └── health/
│
├── core/                     Tenant-agnostic foundation. Never imports from segments.
│   ├── config/env.ts         Type-safe env loader
│   ├── crypto.ts             Meta signature verification
│   ├── logger.ts             Structured JSON logger
│   ├── clients/              External services
│   │   ├── supabase.ts
│   │   ├── qstash.ts
│   │   ├── whatsapp.ts
│   │   └── claude.ts
│   ├── messaging/            Generic conversation/message domain
│   │   ├── webhook-events.ts
│   │   ├── conversations.ts
│   │   └── messages.ts
│   └── tenants/              Tenant resolution + types
│       ├── index.ts          resolveTenant(phoneNumberId)
│       └── types.ts          Tenant, SegmentName
│
└── segments/                 Vertical-specific behavior (salon, restaurant, …)
    ├── README.md             How to add a segment
    ├── types.ts              Segment interface
    ├── index.ts              Registry: name → Segment
    └── salon/
        ├── index.ts          Composes the salon segment
        ├── prompt.ts         buildSalonSystemPrompt(cfg)
        ├── config.ts         zod schema for tenant.config
        └── bookings.ts       extract + persist booking requests
```

## Layered dependencies

```
   app/api/       ───► core/  ───► clients (Supabase, QStash, Claude, Meta)
        │
        └────────► segments/ ───► core/
```

- `core/` never imports from `segments/`.
- `segments/` may import from `core/` freely.
- `app/api/` orchestrates both — that's the only place the two layers meet.

## Why this shape

**Two-stage webhook.** Meta retries aggressively if it doesn't see a 200 within
~5s. Claude calls can easily exceed that. So the webhook does the cheapest
possible work (signature check + DB insert + queue publish) and the worker
does everything else.

**Idempotency on `wa_message_id`.** Meta retries can deliver the same message
twice. `UNIQUE` on `messages.wa_message_id` + `ON CONFLICT DO NOTHING` on
`webhook_events.id` makes duplicate processing a no-op.

**Tenant-driven dispatch.** `tenants.segment` selects which `segments/<name>/`
module handles a given tenant. Adding a vertical = a new folder + one
registry entry; the webhook and worker don't change.

**Tenant config in Postgres, not env vars.** Salon name, hours, services live
in `tenants.config` JSONB. No redeploy to onboard a new tenant.

**Segment interface kept tiny.** Two methods — `buildSystemPrompt` (required)
and `onAgentReply` (optional). Capability creep is the enemy.

## Adding a new vertical

See [`src/segments/README.md`](../src/segments/README.md) for the checklist.
The TL;DR: copy `salon/`, replace `prompt.ts` + `bookings.ts` with your
domain, register in `segments/index.ts`, add tables in a new migration.

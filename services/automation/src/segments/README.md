# Segments

A **segment** is one vertical (salon, restaurant, clinic, retail). One codebase,
many segments — every tenant picks one via `tenants.segment` in Postgres.

## Folder shape

```
segments/
├── README.md            ← this file
├── types.ts             ← Segment interface (don't change without a reason)
├── index.ts             ← registry: maps segment name → implementation
└── <segment>/
    ├── index.ts         ← exports `<name>Segment: Segment`
    ├── prompt.ts        ← buildSystemPrompt(tenant.config) → string
    ├── config.ts        ← zod schema for tenant.config
    └── *.ts             ← segment-specific persistence (bookings, orders, …)
```

## How a request flows through a segment

```
Webhook → Worker
  ↓
resolveTenant(...)            // core/tenants
  ↓
getSegment(tenant.segment)    // segments/index.ts
  ↓
segment.buildSystemPrompt(ctx)
  ↓
LLM call (core/clients/claude)
  ↓
segment.onAgentReply?(ctx, replyText)   // optional hook
  ↓
sendText(cleanText)
```

## Adding a new segment — checklist

1. Add the name to `SegmentName` in `src/core/tenants/types.ts`.
2. Add it to the CHECK constraint in a new migration:
   ```sql
   ALTER TABLE tenants DROP CONSTRAINT tenants_segment_check;
   ALTER TABLE tenants ADD CONSTRAINT tenants_segment_check
     CHECK (segment IN ('salon', 'restaurant', 'clinic', 'retail', '<new>'));
   ```
3. Create `src/segments/<new>/`:
   - `config.ts` — zod schema for tenant.config
   - `prompt.ts` — system prompt builder
   - `index.ts` — `export const <new>Segment: Segment = { ... }`
   - any segment-specific persistence (e.g. `orders.ts`)
4. Add segment-specific tables in a fresh migration if you need them.
5. Register the segment in `src/segments/index.ts`.
6. Done. No webhook/worker changes needed.

## Design rules

- **Core never imports from segments.** One-way dependency.
- **Segments never call core/messaging directly.** They receive context and
  return values; the worker handles persistence orchestration.
- **All tenant-tunable values live in `tenants.config` JSONB.** Never hard-code
  business names, hours, services in TS — that defeats the point.
- **Keep the `Segment` interface small.** Add capabilities only when a second
  segment needs them.

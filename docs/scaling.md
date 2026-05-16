# Scaling — when and what to change

The code is structured so each upgrade is a localized change, not a rewrite.

## Stage 1 — 5–10 users (today)

- Vercel Hobby, Supabase Free, QStash Free
- One agent (`default-agent.ts`)
- No caching layer
- Cost: ~$0–5/mo (Claude API only)

**Watch:** Vercel function 10s timeout on Hobby. If you see 504s in Sentry,
upgrade to Pro ($20).

## Stage 2 — 100 users/day

Changes:
- Vercel **Pro** ($20) for 60s function timeout.
- Enable Anthropic **prompt caching** — already implemented in `lib/claude.ts`,
  just confirm `cache_read_input_tokens` > 0 in `ai_logs` once you add that
  table.
- Add `leads` and `ai_logs` tables (migration `0002_*.sql`).
- Add a basic Next.js dashboard reading from Supabase with the anon key + RLS.

## Stage 3 — 10k users/day

Changes:
- **Move workers off Vercel** to Cloud Run or Fly.io. Keep Next.js (webhook
  ingress + dashboard) on Vercel. Cost crossover is real here: Vercel function-
  seconds get expensive past ~5M invocations/mo.
- **Inngest** instead of QStash if your jobs grow multi-step. Otherwise stay.
- **Upstash Redis** for hot conversation state (last N messages + summary).
- Supabase **Pro** ($25) + read replica for the dashboard.
- Split `default-agent` into specialists (FAQ, lead, sales, escalation) with
  an orchestrator Haiku call routing them. The `pickAgent()` function is the
  one seam to change.

## Stage 4 — 1M users/day

Changes:
- Dedicated Postgres (self-hosted or RDS) — Supabase shared infra runs out
  here.
- **Partition messages and webhook_events by tenant_id** (or by month).
- Kafka/Redpanda or SQS in place of QStash — durability + throughput.
- Workers as a horizontally-scaled service (Cloud Run min instances > 0 to
  avoid cold starts).
- CDN-backed media via R2 + signed URLs.
- Claude **batch API** for non-realtime analytics jobs (lead scoring,
  summarization) — 50% cheaper.

## Upgrade triggers — concrete signals

| Trigger                                         | Do                                                  |
|-------------------------------------------------|-----------------------------------------------------|
| 504s on `/api/jobs/process-message`             | Vercel Pro                                          |
| QStash queue depth > 500/day sustained          | Upgrade QStash, or switch to Inngest                |
| Claude monthly bill > $50                       | Verify prompt caching is hitting; downshift to Haiku |
| p95 worker latency > 8s                         | Add Redis for history, consider Cloud Run           |
| > 1 human operator using the dashboard          | Build the `human_agents` flow + Slack notifications |
| Sentry shows repeated agent confusion           | Split into specialist agents                        |
| Supabase egress > 4GB/mo                        | Add read replica or move dashboard reads to a cache |

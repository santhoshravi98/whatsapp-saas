# Runbook

Operational commands for WAPI. Keep this short — if something belongs in
`setup.md` (one-time setup) or `architecture.md` (design), put it there.

---

## Database migrations

Migrations live in `supabase/migrations/` and are numbered: `0001_*`, `0002_*`, ….
**Always apply in filename order.** Each file is idempotent (`IF NOT EXISTS`,
`ON CONFLICT DO NOTHING`, etc.) so re-running is safe.

### Option A — Supabase CLI (recommended)

One-time setup:
```bash
brew install supabase/tap/supabase
supabase login                                     # browser auth
cd /Users/riyazahamed/Documents/personal/WAPI
supabase link --project-ref <project-ref>          # e.g. dvzyqpdehgzrnrhrwhyz
```

Apply everything that's not yet applied:
```bash
supabase db push
```

If the CLI complains the remote history doesn't match (you previously ran
something via the dashboard):
```bash
supabase migration repair --status applied 0001_init
supabase migration repair --status applied 0002_bookings
supabase migration repair --status applied 0003_tenants_segment
supabase db push
```

### Option B — `psql` directly (no CLI install)

Get connection string: Supabase dashboard → **Connect** → **Connection string** → copy URI.

```bash
cd /Users/riyazahamed/Documents/personal/WAPI

psql "$SUPABASE_DB_URL" \
  -f supabase/migrations/0001_init.sql \
  -f supabase/migrations/0002_bookings.sql \
  -f supabase/migrations/0003_tenants_segment.sql
```

Tip: export the URL once so you don't paste it every time:
```bash
export SUPABASE_DB_URL='postgresql://postgres.<ref>:<password>@aws-...pooler.supabase.com:6543/postgres'
```

### Option C — Dashboard SQL Editor (one-off)

For a single ad-hoc query or one migration: dashboard → **SQL Editor** →
**New query** → paste file contents → **Run**. Don't use this routinely.

### Verify

```bash
psql "$SUPABASE_DB_URL" -c "SELECT id, name, segment, config FROM tenants;"
psql "$SUPABASE_DB_URL" -c "\dt public.*"
```

Expected tables: `tenants`, `users`, `conversations`, `messages`,
`webhook_events`, `bookings`.

---

## Creating a new migration

1. Add a file: `supabase/migrations/000N_<short-name>.sql`
   (use 4-digit zero-padded numbering; one purpose per file).
2. Make it idempotent where reasonable (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`).
3. Test locally first (Supabase CLI: `supabase db reset` against a local stack).
4. Apply: `supabase db push`.
5. Commit the migration file.

---

## Onboarding a new tenant

```sql
INSERT INTO tenants (id, name, segment, config)
VALUES (
  gen_random_uuid(),
  'Acme Salon',
  'salon',
  jsonb_build_object(
    'displayName', 'Acme Salon',
    'hours',       'Mon–Sat, 9am–7pm',
    'address',     '42 Main Street',
    'bookingLink', NULL,
    'services',    jsonb_build_array('haircut','colour','facial')
  )
);
```

Until phone-number → tenant routing ships, `resolveTenant()` always returns
`DEFAULT_TENANT_ID`. To point the system at a new tenant, set
`DEFAULT_TENANT_ID` in `.env.local` (and Vercel) to that row's `id`.

---

## Local development

```bash
npm install
npm run dev                          # http://localhost:3000
curl http://localhost:3000/api/health
```

Type checks + lint:
```bash
npm run typecheck
npm run lint
```

Expose locally for Meta (webhook needs a public HTTPS URL):
```bash
ngrok http 3000
# update APP_BASE_URL in .env.local to the ngrok https URL, restart `npm run dev`
```

---

## Deploying to Vercel

```bash
vercel link --project wapi           # one-time
vercel --prod                        # deploy
vercel env pull .env.production      # sync env vars locally for debugging
```

Env vars are managed by Terraform — never edit them in the Vercel UI; change
`terraform/terraform.tfvars` and `terraform apply` instead.

---

## Terraform

```bash
cd terraform
terraform init                       # one-time
terraform plan                       # preview changes
terraform apply                      # apply
terraform output                     # see project id, etc.
```

To rotate a secret: edit `terraform.tfvars` → `terraform apply`. Vercel picks
up the new value on the next deploy.

---

## QStash — replay a stuck event

If a webhook event got stuck in `failed` and you've fixed the bug, re-enqueue:

```sql
-- Find recent failures
SELECT id, status, attempts, error FROM webhook_events
WHERE status = 'failed' ORDER BY received_at DESC LIMIT 20;
```

Then publish a fresh job pointing at the event id:

```bash
curl -X POST "https://qstash.upstash.io/v2/publish/$APP_BASE_URL/api/jobs/process-message" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Upstash-Deduplication-Id: replay-$(date +%s)" \
  -d '{"eventId":"<event-id>"}'
```

And reset the row so the worker picks it up:
```sql
UPDATE webhook_events SET status = 'received', error = NULL WHERE id = '<event-id>';
```

---

## Inspecting state

```sql
-- Recent inbound messages
SELECT created_at, conversation_id, text FROM messages
WHERE direction = 'in' ORDER BY created_at DESC LIMIT 20;

-- Pending bookings (salon tenant)
SELECT created_at, customer_name, service, preferred_date, preferred_time, status
FROM bookings WHERE status = 'requested' ORDER BY created_at DESC;

-- Webhook event health
SELECT status, COUNT(*) FROM webhook_events
WHERE received_at > now() - interval '1 day' GROUP BY status;

-- Active conversations
SELECT c.id, u.wa_id, u.name, c.status, c.updated_at
FROM conversations c JOIN users u ON u.id = c.user_id
WHERE c.status IN ('active','idle') ORDER BY c.updated_at DESC LIMIT 20;
```

---

## Rotating secrets

| Secret                       | Where to rotate                          | After rotation                          |
|------------------------------|------------------------------------------|-----------------------------------------|
| `META_APP_SECRET`            | Meta App Dashboard → Settings → Basic    | Update `terraform.tfvars` → `terraform apply` |
| `META_ACCESS_TOKEN`          | Business Settings → System Users → token | Same                                    |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase → API Keys → roll               | Same                                    |
| `QSTASH_TOKEN` / signing keys | Upstash console → Rotate                | Update `QSTASH_CURRENT_*` and `QSTASH_NEXT_*` |
| `ANTHROPIC_API_KEY`          | console.anthropic.com → revoke + new     | Same                                    |

Never commit secrets. `terraform.tfvars` is gitignored.

---

## Common failures

| Symptom                                | Cause                                                    | Fix                                       |
|----------------------------------------|----------------------------------------------------------|-------------------------------------------|
| Webhook returns 401                    | Bad signature — body parsed twice, or wrong app secret    | Confirm `META_APP_SECRET`, never JSON.parse before verifying |
| Worker returns 401                     | `APP_BASE_URL` mismatch or wrong QStash signing key       | Match `APP_BASE_URL` to what QStash calls |
| Worker 504 timeout (Vercel Hobby)      | LLM call > 10s                                           | Upgrade to Pro (60s) or lower `maxTokens` |
| Agent emits booking marker to user     | Reply hook didn't strip it                               | Marker must be on its OWN line; check `prompt.ts` |
| Duplicate replies sent                 | QStash retried but worker didn't mark processed early    | Confirm `markProcessing` → success path → `markProcessed` |
| "Tenant not found"                     | `DEFAULT_TENANT_ID` doesn't exist in `tenants` table     | Run migration 0003 (it seeds the row)     |

---

## Logs

- App logs: Vercel dashboard → Project → **Logs** (filter by route).
- Errors: Sentry → Issues.
- Queue: Upstash → QStash → **Events** (success/fail per message).
- DB queries: Supabase → **Logs Explorer** → Postgres logs.

#!/usr/bin/env bash
#
# Deploy the automation service to Vercel.
#
# What this does (in order):
#   1. Pre-flight: typecheck + lint + tests on the local working copy.
#   2. Confirm the Supabase project has all migrations applied — refuses
#      to deploy code that depends on schema the remote doesn't have yet.
#   3. `vercel deploy --prod` from this directory.
#   4. Verify APP_BASE_URL on Vercel is set to a stable alias (not the
#      placeholder, not the per-deploy ephemeral URL). Warn but don't
#      auto-patch — picking the right alias is a one-time decision.
#
# Idempotent: safe to run repeatedly.
#
# Usage:
#   ./scripts/deploy.sh                # full deploy
#   ./scripts/deploy.sh --skip-checks  # skip typecheck/lint/tests
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SERVICE_DIR/../.." && pwd)"

cd "$SERVICE_DIR"

SKIP_CHECKS=0
for arg in "$@"; do
  case "$arg" in
    --skip-checks) SKIP_CHECKS=1 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

say() { printf "\033[1;36m> %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m+ %s\033[0m\n" "$*"; }
warn(){ printf "\033[1;33m! %s\033[0m\n" "$*"; }
die() { printf "\033[1;31mx %s\033[0m\n" "$*" >&2; exit 1; }

# pnpm may not be on PATH (corepack-managed). Resolve once.
if command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  PNPM=(corepack pnpm)
else
  die "pnpm not found (and no corepack). Install pnpm or enable corepack."
fi

# ----- 1. Pre-flight ---------------------------------------------------------
if [[ $SKIP_CHECKS -eq 0 ]]; then
  say "typecheck"
  ( cd "$REPO_ROOT" && "${PNPM[@]}" --filter @whatsapp-saas/automation typecheck )
  ok "typecheck"

  say "lint"
  ( cd "$REPO_ROOT" && "${PNPM[@]}" --filter @whatsapp-saas/automation lint )
  ok "lint"

  say "test"
  ( cd "$REPO_ROOT" && "${PNPM[@]}" --filter @whatsapp-saas/automation test )
  ok "tests"
fi

# ----- 2. Schema sanity ------------------------------------------------------
say "checking migration parity (supabase)"
if ! command -v supabase >/dev/null 2>&1; then
  echo "  (supabase CLI not installed - skipping migration check)"
else
  pending="$(
    ( cd "$REPO_ROOT" && supabase migration list 2>/dev/null ) \
      | awk '/^[[:space:]]*[0-9]+[[:space:]]*\|/ { if ($3 == "|") print $1 }'
  )"
  if [[ -n "$pending" ]]; then
    die "Pending Supabase migrations not applied to remote:\n$pending\n\nRun: (cd $REPO_ROOT && supabase db push)"
  fi
  ok "schema parity"
fi

# ----- 3. Deploy -------------------------------------------------------------
say "deploying to vercel (production)"
DEPLOY_LOG="$(mktemp)"
vercel deploy --prod --yes 2>&1 | tee "$DEPLOY_LOG"
DEPLOY_URL="$(awk '/^Production:[[:space:]]*https:\/\//{print $2; exit}' "$DEPLOY_LOG")"
ALIAS_URL="$(awk '/^Aliased:[[:space:]]*https:\/\//{print $2; exit}' "$DEPLOY_LOG")"
rm -f "$DEPLOY_LOG"
[[ -z "$DEPLOY_URL" ]] && die "could not parse deploy URL from vercel output"
ok "deployed: $DEPLOY_URL"
[[ -n "$ALIAS_URL" ]] && ok "stable alias: $ALIAS_URL"

# ----- 4. APP_BASE_URL sanity ------------------------------------------------
# Each deploy gets a unique URL; APP_BASE_URL should point at the STABLE
# project alias instead. We warn (but never auto-patch) so the operator
# decides which alias is canonical.
TMP_ENV="$(mktemp -u)"  # mktemp -u = name only, file doesn't exist yet
trap 'rm -f "$TMP_ENV"' EXIT
vercel env pull --environment=production "$TMP_ENV" --yes >/dev/null 2>&1 || true
CURRENT_BASE="$(awk -F= '/^APP_BASE_URL=/{sub(/^APP_BASE_URL=/, ""); gsub(/"/, ""); print; exit}' "$TMP_ENV")"

if [[ -z "$CURRENT_BASE" || "$CURRENT_BASE" == "https://wapi.vercel.app" ]]; then
  warn "APP_BASE_URL is unset or still the placeholder."
  echo "  Set it once to your stable alias (e.g. the one printed above):"
  echo
  echo "    vercel env rm APP_BASE_URL production --yes"
  echo "    vercel env add APP_BASE_URL production --value \"<alias>\" --yes --non-interactive"
  echo "    ./scripts/deploy.sh --skip-checks"
  echo
elif [[ "$CURRENT_BASE" == "$DEPLOY_URL" ]]; then
  warn "APP_BASE_URL is set to the ephemeral per-deploy URL."
  echo "  This invalidates on every deploy. Replace with the stable alias above."
else
  ok "APP_BASE_URL = $CURRENT_BASE"
fi

# ----- 5. Reminders ----------------------------------------------------------
PUBLIC_URL="${CURRENT_BASE:-$DEPLOY_URL}"
cat <<EOF

Deployment complete.

  Production URL : $DEPLOY_URL
  Public base    : $PUBLIC_URL
  Webhook URL    : $PUBLIC_URL/api/webhook

  Final manual step (one-time):
    Meta Developer Console -> WhatsApp app -> Webhooks
      callback URL  = the webhook URL above
      verify token  = same as META_VERIFY_TOKEN env var
      subscribe to  = messages

  Tail logs:
    vercel logs --follow
EOF

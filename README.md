# WhatsApp SaaS

A pnpm + Turbo monorepo skeleton for a WhatsApp SaaS product. This is a starter scaffold — each module owner can build out their domain on top of this base. The project structure mirrors the DocParse reference architecture.

## Workspaces

- `apps/landing` — marketing website (Next.js)
- `apps/web-app` — authenticated product dashboard (Next.js)
- `services/backend` — Express API service
- `packages/ui` — shared React UI components
- `packages/utils` — shared TypeScript helpers

## Scripts

Run from the repo root. Requires Node ≥ 20 and pnpm 9.

```bash
pnpm install        # one-time setup
pnpm dev            # runs all three apps via Turbo
pnpm dev:landing    # landing only
pnpm dev:web        # web-app only
pnpm dev:backend    # backend only
pnpm build
pnpm lint
pnpm format
```

## Local Environment

Each app/service uses its own committed development env file for local use:

```bash
apps/landing/.env.development
apps/web-app/.env.development
services/backend/.env.development
```

Production env files live alongside (`.env.production`) and should be populated per deployment target.

## Default ports

- `apps/landing` — `http://localhost:3000`
- `apps/web-app` — `http://localhost:3001`
- `services/backend` — `http://localhost:4000`

## Deployment

- `apps/landing` and `apps/web-app` are intended for Vercel (one project per app, with the matching app folder as the project root).
- `services/backend` is containerized via the root `Dockerfile` and intended for a managed container runtime (e.g. Cloud Run).

FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json turbo.json .npmrc ./
COPY packages ./packages
COPY services/backend ./services/backend

RUN pnpm install --frozen-lockfile

WORKDIR /app/services/backend

CMD ["pnpm", "run", "start"]

# Monorepo-aware build for brew-backend. Build context is the REPO ROOT:
#   docker build -f apps/brew-backend/Dockerfile -t brew-backend .
# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
RUN corepack enable
ENV CI=true
WORKDIR /repo

# Copy the whole workspace (the .dockerignore strips node_modules/dist/infra/mobile);
# --frozen-lockfile validates every workspace member, so they must all be present.
COPY . .
# Install only what the backend needs (itself + @brew/contracts), not the web apps.
RUN pnpm install --frozen-lockfile --filter brew-backend...

# Contracts must build before the backend consumes it.
# NOTE: no `pnpm prune --prod` — in this workspace layout it strips runtime deps
# the backend needs (e.g. reflect-metadata), crashing the container on boot.
RUN pnpm --filter @brew/contracts build \
  && pnpm --filter brew-backend build

FROM node:22-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
# Copy the built workspace (pnpm symlinks + dist + node_modules).
COPY --from=build /repo /repo
WORKDIR /repo/apps/brew-backend
EXPOSE 3000
CMD ["node", "dist/main.js"]

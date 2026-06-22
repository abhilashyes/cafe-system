# Monorepo-aware build for brew-backend. Build context is the REPO ROOT:
#   docker build -f apps/brew-backend/Dockerfile -t brew-backend .
# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

# Copy the whole workspace (the .dockerignore strips node_modules/dist/infra/mobile);
# --frozen-lockfile validates every workspace member, so they must all be present.
COPY . .
# Install only what the backend needs (itself + @brew/contracts), not the web apps.
RUN pnpm install --frozen-lockfile --filter brew-backend...

# Contracts must build before the backend consumes it.
RUN pnpm --filter @brew/contracts build \
  && pnpm --filter brew-backend build \
  && pnpm prune --prod

FROM node:22-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
# Copy the built workspace (pnpm symlinks + dist + prod node_modules).
COPY --from=build /repo /repo
WORKDIR /repo/apps/brew-backend
EXPOSE 3000
CMD ["node", "dist/main.js"]

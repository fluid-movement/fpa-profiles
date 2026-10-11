# Multi-stage build for Coolify.
#
# The runtime image runs two plain-Node entry points without a build step:
# scripts/migrate.ts (before the server starts) and scripts/users.ts (editor
# accounts, run by hand inside the container). Node 24 strips their types.

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Corepack reads packageManager from package.json, so the build uses exactly
# the pnpm version the lockfile was written by.
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
# Kit validates required variables while analysing the build. None of them is
# static, so these placeholders are not baked in: the real values are read
# from the environment when the server starts.
RUN DATABASE_URL=postgres://build ORIGIN=http://build BETTER_AUTH_SECRET=build pnpm build

RUN pnpm prune --prod

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache wget

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
# The scripts import these source modules directly (users: the Better Auth
# tables; import-legacy: the schema, the field registry and the legacy mapping).
COPY --from=builder /app/src/lib/server/db/auth.schema.ts /app/src/lib/server/db/schema.ts ./src/lib/server/db/
COPY --from=builder /app/src/lib/profile ./src/lib/profile
COPY --from=builder /app/src/lib/legacy ./src/lib/legacy
COPY package.json ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

# Migrations first: a deploy with a new schema must not serve the old one.
CMD ["sh", "-c", "node scripts/migrate.ts && node build"]

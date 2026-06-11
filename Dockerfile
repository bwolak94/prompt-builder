# ── Stage 1: install dependencies ────────────────────────────────────────────
# Use npm (not pnpm) to avoid pnpm 11's minimumReleaseAge supply-chain policy
# which rejects recently-published packages during Docker builds.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# PUBLIC_* vars are baked into the client-side JS bundle at build time.
# The browser will hit localhost:8000 (Kong exposed on the host machine).
# Server-side SSR code reads PUBLIC_SUPABASE_URL from process.env at runtime,
# so the docker-compose runtime value (http://kong:8000) takes precedence
# for all SSR requests within the Docker network.
ARG PUBLIC_SUPABASE_URL=http://localhost:8000
ARG PUBLIC_SUPABASE_ANON_KEY
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs astro

# Copy only the built artefacts and runtime node_modules
COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=builder --chown=astro:nodejs /app/node_modules ./node_modules
COPY --chown=astro:nodejs package.json .

USER astro

# @astrojs/node standalone server reads HOST and PORT from environment
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4321/api/health || exit 1

CMD ["node", "./dist/server/entry.mjs"]

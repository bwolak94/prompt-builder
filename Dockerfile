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
# so the docker-compose.app.yml runtime value (http://kong:8000) takes precedence
# for all SSR requests within the Docker network.
ARG PUBLIC_SUPABASE_URL=http://localhost:8000
ARG PUBLIC_SUPABASE_ANON_KEY
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Copy only the built artefacts and runtime node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

# @astrojs/node standalone server reads HOST and PORT from environment
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]

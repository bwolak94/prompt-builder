<div align="center">

# PromptBase

**A structured prompt engineering platform for AI developers and power users.**

Build, version, test, and deploy prompts with the same rigour you apply to code.

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-5-FF5D01?style=flat-square&logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-self--hosted-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Contributing](#contributing)

</div>

---

## Overview

PromptBase brings software engineering discipline to prompt design. Instead of copy-pasting prompts from chat windows, you get a structured workspace with drag-and-drop block composition, typed variables, multi-model AI scoring, version history, environment promotion (dev → staging → production), and a REST API + CLI for integrating prompts into your own pipelines.

**What makes it different from a notes app:**

| Capability | PromptBase | Notes / Gists |
|---|---|---|
| Structured blocks (Role, Task, Format…) | Yes | No |
| Typed variable system | Yes | No |
| AI quality scoring (OpenAI + Anthropic) | Yes | No |
| Dev / Staging / Production environments | Yes | No |
| Version history with diff | Yes | No |
| REST API + CLI (`npx promptbase`) | Yes | No |
| A/B testing prompts | Yes | No |
| Webhook integrations | Yes | No |
| Self-hosted, no vendor lock-in | Yes | No |

---

## Features

### Core Builder
- **Block-based composition** — drag-and-drop sections (Role, Context, Task, Format, Constraints, Examples, Tone, Audience, Chain-of-Thought, JSON Schema) with a live Markdown preview
- **Typed variables** — `{{name}}`, `{{lang:select:Python,JS,Go}}`, `{{level:number:1:10}}`, `{{notes:multiline}}`, `{{tests:boolean}}` — usable in the builder and on public shareable links
- **Import** — paste a raw prompt from ChatGPT or Claude; heuristic or AI-powered parsing breaks it into blocks automatically

### Quality & Testing
- **AI Scoring** — structured 0–100 score across Clarity, Specificity, Structure, Tone, and Completeness; streaming SSE response; supports OpenAI `gpt-4o-mini` and Anthropic `claude-haiku-4-5`
- **Multi-model scoring** — compare scores from OpenAI, Anthropic, and Gemini in a radar chart side-by-side
- **A/B testing** — create a variant, run offline score comparison or live LLM calls on the same input, apply or discard the winner
- **AI Auto-Improve** — per-block or whole-prompt improvement with three variants (shorter / more precise / better structure) and an explanation

### Versioning & Deployment
- **Version history** — timestamped snapshots with optional change summary; restore any previous version; free tier: 3 versions, Pro: unlimited
- **Environments** — pin prompts to `dev`, `staging`, and `production`; promote between environments; API consumers can request `?env=production` to always get the stable version
- **Token Optimizer** — preview token count and estimated cost across models before deploying; aggressive (−40%) and conservative (−20%) modes

### Organisation
- **Collections** — nested folders (up to depth 5), many-to-many prompt assignment, sharable as a public bundle link
- **Auto-categorisation** — background AI job after every save proposes category, difficulty, and tags; accept or edit via toast notification
- **Community feed** — public `/community` page with trending, recent, top-rated, and featured sections; fork any public prompt with one click
- **Challenges** — weekly community prompt challenges with voting, leaderboard, and badges

### Developer Tools
- **REST API v1** — bearer-token authenticated; CRUD prompts, read templates; pagination, search, environment pinning
- **CLI** (`npx promptbase`) — `login`, `list`, `pull <id>`, `push <file.md>`, `sync <directory>`; prompts stored as Markdown with YAML frontmatter
- **Webhooks** — generic (HMAC-SHA256 signed), Slack, and Discord; events: `prompt.forked`, `prompt.commented`, `prompt.rated`, `prompt.score_ready`, `challenge.won`; exponential-backoff retry with delivery log
- **Browser extension** — Chrome Manifest V3; quick access to your library, save any textarea content as a new prompt

### Internationalisation
- Full Polish and English UI; language stored in a cookie, switchable without reload; all translation keys strictly typed via a `Translations` interface

---

## Architecture

PromptBase uses **Astro 5 Islands Architecture** — pages are server-rendered static HTML by default, with React 19 hydrated only where interactivity is needed. This keeps Core Web Vitals low (LCP < 1.5 s on the landing page) while delivering a rich SPA experience inside the builder.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  Astro Pages (static HTML/CSS)      React Islands (hydrated)   │
│  ─────────────────────────────      ────────────────────────── │
│  /, /p/[slug], /community           BuilderIsland (client:load) │
│  /explore (SSR)                     DashboardIsland             │
│  /profile/[username]                SettingsIsland              │
│                                     AIScoreIsland               │
└────────────────────┬────────────────────────────────────────────┘
                     │ fetch / SSE
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Astro SSR (Node adapter)                                       │
│                                                                 │
│  src/middleware/index.ts                                        │
│    0. Bearer token auth   → /api/v1/* (REST API)               │
│    1. Supabase session     → locals.supabase, locals.user       │
│    2. Auth guard           → redirect /login for protected      │
│    3. Rate limiting        → in-memory TTL map                  │
│    4. CORS headers                                              │
│                                                                 │
│  src/pages/api/            src/lib/services/                   │
│  ─────────────────         ──────────────────                  │
│  /api/prompts/*            prompt.service.ts                   │
│  /api/ai-score             ai-score.service.ts                 │
│  /api/collections/*        collection.service.ts               │
│  /api/v1/*  (REST)         environment.service.ts              │
│  /api/webhooks/*           chain.service.ts                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────┐   ┌─────────────────────────┐
│  Supabase Stack │   │  AI Providers           │
│  (Docker)       │   │                         │
│                 │   │  OpenAI gpt-4o-mini      │
│  PostgreSQL 15  │   │  Anthropic claude-haiku  │
│  GoTrue Auth    │   │  Google Gemini Pro       │
│  PostgREST      │   │  (Streaming SSE)         │
│  Supabase       │   └─────────────────────────┘
│  Storage        │
│  Kong API GW    │
│  Row Level      │
│  Security       │
└─────────────────┘
```

### Key Design Patterns

**Repository + Service layers** — database queries are isolated in `src/db/repositories/`, business logic lives in `src/lib/services/`. API routes are thin controllers that validate input with Zod, call a service, and return a typed response envelope.

```
API Route (Zod validate) → Service (business logic) → Repository (SQL)
```

**AI Provider Abstraction** — a `ScoringProvider` interface decouples the scoring pipeline from any specific LLM. Adding a new provider requires only one class implementing two methods.

**API Response Envelope** — every API route returns a consistent shape, making client-side error handling predictable:

```typescript
type ApiSuccess<T> = { success: true; data: T };
type ApiError   = { success: false; error: string; code: string };
```

**Zustand per-island state** — each React island owns an isolated Zustand store. There is no global client-side state shared between islands; they communicate via server state (URL, SSR props).

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Astro 5 (SSR + SSG hybrid) | Islands Architecture; better Core Web Vitals than Next.js for mostly-static pages |
| UI Islands | React 19 | `useOptimistic`, `useTransition`, concurrent features in the builder |
| Language | TypeScript 5 (`strict: true`) | End-to-end type safety; no `any` |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first; dark mode via CSS variables; no runtime style overhead |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | Accessibility-first; no pointer-event hacks |
| Auth + DB | Supabase (self-hosted Docker) | PostgreSQL 15, GoTrue, PostgREST, Storage, Row Level Security |
| Island state | Zustand | Minimal; no boilerplate; works outside React tree |
| Forms | React Hook Form + Zod | Schema-first validation shared between client and server |
| AI Scoring | OpenAI `gpt-4o-mini` + Anthropic `claude-haiku-4-5` | Multi-provider; streaming SSE |
| Markdown | react-markdown + remark-gfm + shiki | Prompt preview with syntax highlighting |
| Tests | Vitest + Testing Library | Unit + integration tests co-located with source |
| CLI | Commander.js + gray-matter | Standalone npm package in `packages/cli/` |
| Extension | Chrome Manifest V3 + Vite | Popup, options page, content script, background service worker |
| Deployment | Docker Compose | Reproducible local + VPS setup; nginx reverse proxy |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Docker + Docker Compose
- An OpenAI or Anthropic API key (optional — only needed for AI scoring features)

### 1. Clone & install

```bash
git clone https://github.com/your-username/prompt-builder.git
cd prompt-builder
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Supabase (auto-configured for local Docker — only change if using hosted Supabase)
PUBLIC_SUPABASE_URL=http://localhost:8000
PUBLIC_SUPABASE_ANON_KEY=<generated by Supabase>
SUPABASE_SERVICE_ROLE_KEY=<generated by Supabase>

# AI providers (optional — needed for scoring, auto-improve, token optimizer)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# App
PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start the Supabase stack

```bash
docker compose -f docker-compose.supabase.yml --env-file .env.local up -d
```

This starts PostgreSQL 15, GoTrue auth, PostgREST, Kong, Storage, and Supabase Studio (available at `http://localhost:54323`).

### 4. Run database migrations

```bash
# Apply all migrations in order
for f in supabase/migrations/*.sql; do
  docker exec -i promptbase-supabase-db-1 psql -U postgres -d postgres < "$f"
done
```

### 5. Start the app

```bash
# Development (hot reload)
npm run dev

# Or run the full stack in Docker
docker compose -f docker-compose.supabase.yml -f docker-compose.app.yml \
  --env-file .env.local up -d --build
```

App is available at `http://localhost:3000`.

---

## Project Structure

```
prompt-builder/
├── src/
│   ├── pages/                   # Astro pages (file-based routing)
│   │   ├── index.astro          # Landing page (SSG)
│   │   ├── dashboard.astro      # Prompt library (SSR, auth required)
│   │   ├── builder/
│   │   │   ├── index.astro      # New prompt
│   │   │   └── [id].astro       # Edit prompt
│   │   ├── p/[slug].astro       # Public prompt view
│   │   ├── community.astro      # Community feed
│   │   ├── explore.astro        # Template library
│   │   ├── chains/              # Prompt chains
│   │   └── api/                 # API routes
│   │       ├── prompts/
│   │       ├── collections/
│   │       ├── ai-score/
│   │       ├── webhooks/
│   │       └── v1/              # Public REST API
│   ├── components/
│   │   ├── builder/             # BuilderIsland + store + sub-components
│   │   ├── dashboard/           # DashboardIsland + PromptCard
│   │   ├── collections/         # CollectionsSidebar + useCollections hook
│   │   ├── settings/            # SettingsIsland, RestApiKeysPanel, WebhooksPanel
│   │   ├── chains/              # ChainBuilderIsland
│   │   ├── public/              # Public prompt page components
│   │   └── ui/                  # shadcn/ui components
│   ├── db/
│   │   ├── supabase.client.ts   # Typed Supabase client
│   │   ├── types.ts             # Generated + extended DB types
│   │   └── repositories/        # Data access layer (one file per table group)
│   ├── lib/
│   │   ├── services/            # Business logic layer
│   │   ├── api/                 # Response helpers, auth guard, Zod validators
│   │   ├── api-key/             # Key generation (pb_live_...) + SHA-256 hashing
│   │   ├── webhooks/            # Dispatcher, HMAC signer, Slack/Discord formatters
│   │   └── i18n/                # Translations (PL/EN), typed Translations interface
│   ├── middleware/
│   │   └── index.ts             # Auth, Bearer token, rate limiting, CORS
│   └── types.ts                 # Shared domain types (Prompt, PromptBlock, etc.)
├── packages/
│   └── cli/                     # npx promptbase — standalone npm package
│       └── src/
│           ├── commands/        # login, list, pull, push, sync
│           └── lib/             # ApiClient, file-parser (gray-matter), config
├── extension/                   # Chrome extension (Manifest V3)
│   └── src/
│       ├── background/          # Service worker
│       ├── content/             # Content script (textarea detection)
│       ├── popup/               # Quick-access popup
│       └── options/             # Settings page
├── supabase/
│   └── migrations/              # Timestamped SQL migration files
└── docker-compose.supabase.yml  # Full Supabase stack
```

---

## Database Schema

The database uses **PostgreSQL 15** with Row Level Security enforced on every table. Migrations are managed with the Supabase CLI and stored as timestamped SQL files.

```
profiles                    prompts
────────────────────        ──────────────────────────
id (uuid, PK → auth.users)  id (uuid, PK)
display_name                user_id → profiles
username (unique)           title, description
avatar_url                  content_md (final Markdown)
bio                         blocks (JSONB snapshot)
preferences (JSONB)         variables (JSONB)
                            tags (text[])
                            is_public, slug (unique)
collections                 fork_of → prompts
────────────────────        view_count, fork_count
id, user_id → profiles      deleted_at (soft delete)
name, parent_id (self-ref)  search_vector (GIN index)
depth (0–5)
is_public, slug
color, icon                 prompt_versions
                            ──────────────────────────
collection_prompts          id, prompt_id, version_number
────────────────────        blocks (JSONB), content_md
collection_id, prompt_id    summary, created_at
added_at

prompt_environments         api_keys
────────────────────        ──────────────────────────
prompt_id, environment      id, user_id → profiles
  (dev|staging|production)  key_hash (SHA-256)
version_id, content_md      prefix, suffix (for display)
blocks (JSONB)              is_active, last_used_at
promoted_by, promoted_at

webhooks                    webhook_deliveries
────────────────────        ──────────────────────────
id, user_id                 webhook_id, event_type
type (generic|slack|discord)payload (JSONB)
label, url, events (text[]) status_code, attempt
secret (HMAC key)           delivered_at, error
is_active
```

Full schema with RLS policies in [`supabase/migrations/`](supabase/migrations/).

---

## API Reference

All v1 endpoints require `Authorization: Bearer <api_key>` (keys generated in Settings → API).

### Prompts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/prompts` | List prompts. Params: `page`, `limit`, `search`, `is_public` |
| `POST` | `/api/v1/prompts` | Create a prompt |
| `GET` | `/api/v1/prompts/:id` | Get a prompt. Param: `?env=production` to get environment-pinned content |
| `PUT` | `/api/v1/prompts/:id` | Update title, description, blocks, variables, tags, is_public |
| `DELETE` | `/api/v1/prompts/:id` | Soft-delete |

### Templates (public, no auth)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/templates` | List system templates. Params: `category`, `difficulty`, `cursor` |
| `GET` | `/api/v1/templates/:id` | Get a single template |

### Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/me` | Authenticated user profile + prompt stats |

### Response envelope

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Not found", "code": "NOT_FOUND" }
```

---

## CLI

Install globally or use directly with npx:

```bash
npm install -g promptbase-cli
# or
npx promptbase <command>
```

```bash
# Authenticate with your API key (Settings → API in the web app)
promptbase login --key pb_live_xxxxx

# List all your prompts
promptbase list
promptbase list --format json

# Download a prompt as a Markdown file
promptbase pull <prompt-id>
promptbase pull <prompt-id> --env production --output ./prompts/my-prompt.md

# Upload a local .md file (creates if no id in frontmatter, updates if id present)
promptbase push ./prompts/my-prompt.md

# Two-way sync an entire directory
promptbase sync ./prompts/
promptbase sync ./prompts/ --dry-run   # preview changes without applying
```

Prompts are stored as Markdown files with YAML frontmatter:

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
title: Code Reviewer Pro
description: Reviews code for bugs, style, and performance
tags: [coding, review]
is_public: true
env: production
---

## Role
You are a senior software engineer performing a thorough code review...
```

---

## Webhooks

Configure webhooks in Settings → Integrations. All delivery attempts are logged with status codes and response bodies.

**Supported types:** Generic (custom URL), Slack, Discord

**Event payload (generic):**

```json
{
  "event": "prompt.forked",
  "timestamp": "2026-06-12T09:00:00Z",
  "data": {
    "prompt_id": "...",
    "forked_by": "username",
    "title": "Code Reviewer Pro"
  }
}
```

Generic webhooks include an `X-PromptBase-Signature: sha256=<hmac>` header for payload verification. Retry policy: 3 attempts with exponential backoff (1 s, 4 s, 16 s).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Yes | Supabase API gateway URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-side only) |
| `OPENAI_API_KEY` | No | For AI scoring and auto-improve features |
| `ANTHROPIC_API_KEY` | No | For multi-model scoring |
| `AI_SCORE_RATE_LIMIT` | No | Max score requests per window (default: 10) |
| `AI_SCORE_RATE_WINDOW` | No | Rate limit window in ms (default: 3600000) |
| `PUBLIC_APP_URL` | Yes | Full app URL (used for slug generation) |
| `NODE_ENV` | No | `development` or `production` |

---

## Running Tests

```bash
# Unit + integration tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests use **Vitest** and are co-located with source files in `__tests__/` directories. Repositories and services are tested with mocked Supabase clients.

---

## Docker Deployment

The full stack runs in Docker Compose. The application image is a Node.js 22 container running the Astro Node adapter.

```bash
# Build and start everything
docker compose \
  -f docker-compose.supabase.yml \
  -f docker-compose.app.yml \
  --env-file .env.local \
  up -d --build

# View logs
docker compose -f docker-compose.supabase.yml -f docker-compose.app.yml logs -f app

# Stop everything
docker compose \
  -f docker-compose.supabase.yml \
  -f docker-compose.app.yml \
  down
```

Services exposed:

| Service | Port | Description |
|---|---|---|
| App | 3000 | Astro SSR application |
| Kong (Supabase API GW) | 8000 | All Supabase services |
| PostgreSQL | 5432 | Direct DB access |
| Supabase Studio | 54323 | Database GUI |
| Inbucket | 54324 | Local email testing |

---

## Browser Extension

The Chrome extension (Manifest V3) lives in `extension/`. It provides:

- **Popup** — search and copy prompts from your library without leaving the current tab
- **Content script** — detects text areas on ChatGPT, Claude, and other AI interfaces; injects a "Save to PromptBase" button
- **Options page** — configure the PromptBase host URL and verify authentication status

```bash
cd extension
npm install
npm run build          # outputs to extension/dist/
```

Load `extension/dist/` as an unpacked extension in `chrome://extensions`.

---

## Contributing

Contributions are welcome. Please open an issue first to discuss the change you have in mind.

```bash
# Create a feature branch
git checkout -b feat/your-feature

# Make your changes, then run checks
npm run test
npx tsc --noEmit

# Commit using conventional commits
git commit -m "feat: add prompt diff view"

# Open a pull request against main
```

**Code conventions:**
- TypeScript `strict: true` — no `any`, explicit function return types
- Service layer for business logic, repository layer for DB queries
- Zod schemas at all API boundaries
- RLS policies for every new database table
- Migration files named `YYYYMMDDHHmmss_description.sql`

---

## License

MIT © 2026

---

<div align="center">

Built with [Astro](https://astro.build) · [Supabase](https://supabase.com) · [React](https://react.dev) · [Tailwind CSS](https://tailwindcss.com)

</div>

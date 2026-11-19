# Phase 0 — Foundation

## Version & scope

v0.1.0 · OR-0.1 … OR-0.7 · Exit: [ROADMAP Fase 0](../../docs/ROADMAP.md)

## Decisions locked

- [Stack](../plans/accessmap-phase-0/decisions/01-stack-nuxt-drizzle-bun.md) — Nuxt 4, bun, Drizzle `pg`
- [i18n](../plans/accessmap-phase-0/decisions/02-i18n-no-prefix.md) — `no_prefix`, `en` default
- [Auth](../plans/accessmap-phase-0/decisions/03-auth-custom-sessions.md) — custom sessions, first-user signup
- [Compose](../plans/accessmap-phase-0/decisions/04-compose-dev-prod.md) — dev DB+Mailpit; prod app+DB+Caddy

## Behaviors

1. **Given** no users, **when** I register, **then** I am owner of a new personal workspace and logged in.
2. **Given** a user exists, **when** I POST register, **then** signup is rejected unless env override allows it.
3. **Given** I am logged in, **when** I create project + asset, **then** both rows have my `workspace_id`.
4. **Given** workspace A and B, **when** user A requests B’s asset by id, **then** 404 or 403 without leaking B’s data.
5. **Given** locale cookie `es`, **when** I view UI, **then** copy is Spanish and URL path unchanged.

## Schema (F0 minimum)

`users`, `sessions`, `workspaces`, `workspace_members`, `projects`, `assets` — extend in F1 per spec §15.

## Build tickets

### OR-0.1 — Compose & env

- **Goal:** Runnable Postgres (+ Mailpit) locally; prod compose skeleton.
- **Scope:** `compose.dev.yml`, `compose.prod.yml`, `Dockerfile`, `.env.example`, `README` dev notes.
- **Deps:** none
- **Done means:** `docker compose -f compose.dev.yml up` starts DB and Mailpit; `.env.example` documents `DATABASE_URL`.
- **Checklist:**
  - [ ] compose.dev.yml
  - [ ] compose.prod.yml + Dockerfile
  - [ ] .env.example

### OR-0.2 — Nuxt shell

- **Goal:** Nuxt 4 app with Tailwind, Reka UI, AppIcon, layout.
- **Deps:** OR-0.1
- **Done means:** `bun dev` serves a styled shell with nav placeholders.

### OR-0.3 — Drizzle core schema

- **Goal:** Migrated tables for users, sessions, workspaces, members, projects, assets.
- **Deps:** OR-0.1
- **Done means:** `bun run db:migrate` applies migrations against dev Postgres.

### OR-0.4 — Auth API

- **Goal:** Register (if empty), login, logout, password reset flow (Mailpit).
- **Deps:** OR-0.3
- **Done means:** Session cookie set on login; register blocked after first user.

### OR-0.5 — Workspace + CRUD slice

- **Goal:** Auto personal workspace; project + asset HTTP API and basic pages.
- **Deps:** OR-0.4
- **Done means:** End-to-end create project and asset from UI.

### OR-0.6 — i18n

- **Goal:** `@nuxtjs/i18n` en/es, cookie, language switcher.
- **Deps:** OR-0.2
- **Done means:** No `/es` in URLs; switcher updates strings.

### OR-0.7 — Tenant isolation test

- **Goal:** Automated test for cross-workspace access denial.
- **Deps:** OR-0.5
- **Done means:** Test fails if workspace B data returned to user A.
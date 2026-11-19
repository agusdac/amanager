---
name: nuxt-drizzle-stack
description: >-
  AccessMap stack conventions: Nuxt 4, bun, Drizzle pg, custom sessions, Compose.
  Use when scaffolding the app, database, auth, Docker, or server API routes.
---
# Nuxt + Drizzle stack (AccessMap)

See [docs/ROADMAP.md](../../../docs/ROADMAP.md) for PR order.

## Tooling

- **bun** for install, scripts, and runtime (prefer over npm/pnpm in this repo).
- **Nuxt 4**, TypeScript strict, Nitro for API under `server/`.
- **Zod** in `shared/schemas` for API input/output shared with client where useful.

## Database

- PostgreSQL 16 via Docker in dev (`compose.dev.yml`).
- **Drizzle** + driver **`pg`** (`node-postgres`), migrations in `db/migrations/`.
- Seed in `db/seed/` — fictional Mini Críptico data only.

## Auth (custom sessions)

- Tables: `users` (password hash via `Bun.password` argon2id), `sessions` (hash session token at rest).
- Cookie: HTTP-only session id, `Secure` in production, `SameSite=Lax`.
- **Signup open only when `users` count is 0**; that user becomes workspace owner. Else register disabled (env override for emergencies only).
- Password reset emails via SMTP; **Mailpit** in dev Compose.

## Compose

| File | Services |
| --- | --- |
| `compose.dev.yml` | Postgres, Mailpit |
| `compose.prod.yml` | App image (bun), Postgres, Caddy |

Run Nuxt with `bun dev` on the host in development (not in dev Compose).

## UI stack

- Tailwind + **Reka UI** primitives.
- Icons: `app/components/icons/`, `AppIcon.vue` wrapper — see `.cursor/rules/icons.mdc`.
- No Nuxt UI / Lucide / emoji in product UI.

## Server patterns

- `server/services/` + `server/repositories/`; every query scoped by `workspace_id` from session membership.
- Return 404/403 for other tenants' IDs — no existence leak.
- Audit sensitive mutations (`audit_events`) when tables exist.

## i18n

Apply skill **i18n-en-es**: `no_prefix`, cookie locale.
# Map — AccessMap Phase 0 (Foundation)

## Destination

Fase 0 exit per [docs/ROADMAP.md](../../../docs/ROADMAP.md): authenticated user lands in a personal workspace, creates a project and an asset persisted in PostgreSQL; second workspace cannot read the first.

## Notes

- Product spec: [docs/ACCESSMAP_SPEC_CURSOR.md](../../../docs/ACCESSMAP_SPEC_CURSOR.md) · Skills: `nuxt-drizzle-stack`, `no-secrets`, `i18n-en-es`, `domain-model`
- Version: **v0.1.0** · Slug: `accessmap-phase-0` · Forge: local twin only (no issues yet)
- Build tickets: [product/specs/accessmap-phase-0.md](../../specs/accessmap-phase-0.md) OR-0.1 … OR-0.7
- **Build status (2026-11-19):** app scaffolded; OR-0.1–0.7 implemented in repo. Run `docker compose -f compose.dev.yml up -d` then `bun run db:push` and `bun run dev`. Reka UI dependency present; minimal UI uses plain forms until F1 polish.

## Decisions so far

- [Stack: Nuxt 4, bun, Drizzle pg](./decisions/01-stack-nuxt-drizzle-bun.md) — locked in spec §17
- [i18n en/es, no_prefix](./decisions/02-i18n-no-prefix.md) — cookie locale, same URLs
- [Auth: custom sessions](./decisions/03-auth-custom-sessions.md) — first user only signup
- [Compose dev vs prod](./decisions/04-compose-dev-prod.md) — Postgres+Mailpit / app+Postgres+Caddy

## Not yet specified

- MFA timing (post–F0)
- Exact Caddy prod hostname (env at deploy)
- E2E runner choice (Vitest integration first; Playwright later)

## Out of scope

- Fase 1 inventory (continues in [accessmap-phase-1 map](../accessmap-phase-1/map.md))
- Runbooks and migration plans (F2–F3)
- Forge issue sync for OR tickets (until requested)
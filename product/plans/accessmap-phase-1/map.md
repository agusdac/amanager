# Map — AccessMap Phase 1 (Inventory)

## Destination

Dogfood inventory complete: register Mini Críptico (manual, wizard, or CSV) and answer spec **[§4.4](../../../docs/ACCESSMAP_SPEC_CURSOR.md)** and **[§26.A](../../../docs/ACCESSMAP_SPEC_CURSOR.md)**. Second workspace still cannot read first.

## Notes

- Depends on [Phase 0 map](../accessmap-phase-0/map.md) (shipped foundation in repo).
- Version: **v0.2.0** · Slug: `accessmap-phase-1` · Forge: local twin only.
- Skills: `domain-model`, `no-secrets`, `i18n-en-es`, `minicriptico-dogfood`.
- Contract: [brief](../../features/accessmap-phase-1.md) · [spec](../../specs/accessmap-phase-1.md).
- Handoff: invoke **fire-in-the-hole** (or direct agent) on **OR-1a** first after schema migration.
- **Build status (2026-11-19):** OR-1a … OR-1h implemented. Apply `bun run db:migrate` + `bun run db:seed` after Docker is up.

## Decisions so far

- [Provider catalog (system seed)](./decisions/01-provider-catalog.md) — global `providers`, optional on asset
- [Onboarding draft storage](./decisions/02-onboarding-draft-storage.md) — `onboarding_drafts` jsonb in Postgres
- [Search & impact defaults](./decisions/03-search-and-impact.md) — ILIKE + BFS list, depth 8, F1 nav set
- Inherited from Phase 0: stack, i18n `no_prefix`, custom sessions, Compose — see [accessmap-phase-0/decisions](../accessmap-phase-0/decisions/)

## Not yet specified

- E2E with Playwright (Vitest API tests sufficient for F1 unless dogfood demands browser CI)
- `audit_events` write paths for every mutation vs subset (recommend: roles, imports, vault refs)

## Out of scope

- Runbooks / README generator (F2)
- Migration plan engine (F3)
- Dependency **graph** visualization
- `clients` UI, invitations, billing
- External read-only integrations
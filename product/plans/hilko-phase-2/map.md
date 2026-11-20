# Map — Hilko Phase 2 (Runbooks & README)

## Destination

**v0.3.0** ships spec **§21 MVP**: system setup templates (≥3), project/environment runbooks generated from inventory metadata, in-app manual execution (step states + history), Markdown export in the user’s active locale. README is a snapshot — no secrets, no command execution. Dogfood: Northline (or real project) yields a useful **developer onboarding** export; checklist §4.4 q9 becomes answerable in-app.

## Notes

- Depends on [Phase 1 map](../hilko-phase-1/map.md) (inventory, envs, vault refs, config entries, audit minimal).
- Version: **v0.3.0** · Slug: `hilko-phase-2` · Forge: local twin (TBD).
- Spec: [HILKO_SPEC_CURSOR.md](../../../docs/HILKO_SPEC_CURSOR.md) §21, exit §26.B (README export).
- Skills (build): `domain-model`, `no-secrets`, `i18n-en-es`, `nuxt-drizzle-stack`; add **runbook-author** when implemented.
- Plan mode: no OR-* implementation in pathfind sessions unless Notes overridden.
- **Contract (Phase B):** [brief](../../features/hilko-phase-2.md) · [spec](../../specs/hilko-phase-2.md) · [v0.3.0 overview](../../v0.3.0/overview.md)
- Inherited: workspace scope, metadata-only, i18n `no_prefix`, custom sessions, Compose.

## Decisions so far

- [MVP scope = full §21 slice](./decisions/01-runbook-mvp-scope.md) — templates + runbook + execution UI + export; no repo import (V1), no shell executor.
- [System template catalog (3)](./decisions/02-system-template-catalog.md) — `new-developer-onboarding`, `staging-environment-bootstrap`, `access-handover-checklist`.
- [Generator + incomplete inventory](./decisions/03-generator-missing-inventory.md) — pending steps, export OK, no invented values.
- [Runbook editor UX](./decisions/04-runbook-editor-ux.md) — copy from template; full Markdown per step + overview; cautious inventory refresh.
- [Guides navigation](./decisions/05-guides-navigation.md) — Home card + nav Guías + pestaña proyecto; export en detalle.
- [Runbook project binding](./decisions/06-runbook-project-binding.md) — `projectId` required; executions per runbook; list filterable.
- [Execution content binding](./decisions/07-execution-content-binding.md) — default **snapshot** on start; opt-in **live**; export rules per mode.
- [Runbook audit events](./decisions/08-runbook-audit-events.md) — lifecycle + export audited; step marks not; no audit UI.

## Not yet specified

_(none — ready for Phase B consolidate.)_

## Out of scope

- Migration plan engine (F3), GitHub/README import (spec V1), command runner, provider read-only integrations (F6).
- Team invites, billing, clients UI (F4–F5).
- Auto-interpolation of secret-like strings into exports (`no-secrets`).
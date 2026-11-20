# Map — Hilko Phase 4 (Colaboración)

## Destination

**v0.4.0** ships spec **Fase 4**: two users collaborate in a **team workspace** without cross-workspace data leaks; each user keeps a **personal** workspace; **explicit copy** of a personal project into a team workspace runs through a **preview** that surfaces vault refs, emails, and sensitive metadata before commit. **Fase 3 (migraciones)** is deferred to a later milestone (proposed **v0.5.0**).

## Notes

- Product: Hilko · Repo `amanager` · Spec [HILKO_SPEC_CURSOR.md](../../../docs/HILKO_SPEC_CURSOR.md) §14, Fase 4
- Target version: **v0.4.0** · Slug: `hilko-phase-4`
- Skills (build): `domain-model`, `no-secrets`, `i18n-en-es`, `nuxt-drizzle-stack`
- Plan mode: decisions first; no OR-* implementation in pathfind sessions unless Notes overridden
- **Contract (Phase B):** [brief](../../features/hilko-phase-4.md) · [spec](../../specs/hilko-phase-4.md) · [v0.4.0 overview](../../v0.4.0/overview.md)
- Roadmap order: **F4 before F3** (user decision, 2026-11-20)
- Today: session binds only `workspaces.type = personal`; no invites; `workspace_members` schema exists

## Decisions so far

- [Workspace model: team + personal + project copy with preview](./decisions/01-workspace-collaboration-model.md) — Hybrid **D**: team workspaces + switcher; personal stays; share personal project → team via preview in v0.4.0
- [MVP first slice](./decisions/02-mvp-first-slice.md) — Slice 1: team CRUD + invites + switcher + API roles; slice 2: project copy with preview
- [Invite flow](./decisions/03-invite-flow.md) — Email link; register **or** login + accept for existing users
- [Role enforcement](./decisions/04-role-enforcement.md) — Baseline roles; details in [06](./decisions/06-permission-matrix.md)
- [Project copy preview](./decisions/05-project-copy-preview.md) — Categorized list; user can exclude rows before copy
- [Permission matrix](./decisions/06-permission-matrix.md) — API table; editor deletes own projects; viewer CSV+runbook MD; invites admin+owner
- [Invite expiry](./decisions/07-invite-expiry.md) — 7 days; resend rotates token
- [Signup policy](./decisions/08-signup-policy.md) — Open register default; env flag; invite-gated register when off
- [Offboarding](./decisions/09-offboarding.md) — Owner must promote before leave; admin cannot grant owner
- [Assignees](./decisions/10-assignees.md) — Verifications + runbook step defaults; execution override
- [Copy preview redaction](./decisions/11-copy-preview-redaction.md) — Full metadata preview; flagged default-included + extra confirm; scanner blocks without override
- [Audit](./decisions/12-audit-collaboration.md) — Admin+owner activity feed (50/event page); collaboration audit actions
- [Implementation order](./decisions/13-implementation-order.md) — OR-F4-1…5 (session → invites → assignees ∥ copy → audit)

## Not yet specified

_(none — Phase B consolidated 2026-11-20)_

## Out of scope

- Fase 5 agency (`clients` UI, billing, handover cliente-agencia)
- Fase 3 migration plan engine (deferred)
- Fase 6 provider integrations
- Billing / paid plans
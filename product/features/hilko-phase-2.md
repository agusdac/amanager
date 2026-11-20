# hilko-phase-2 — Runbooks & setup README

## Version

**v0.3.0** (unreleased) — spec **§21 MVP** on top of v0.2.0 inventory; exit **§26.B** (README export).

## Plan

- [Map](../plans/hilko-phase-2/map.md)
- [Slim spec](../specs/hilko-phase-2.md)
- [Phase 1 prerequisite](../features/hilko-phase-1.md)

## Description

Turn inventory metadata into **setup runbooks**: three global templates, generated project/environment instances, in-app manual execution with history, and Markdown export in the user’s locale. No command runner, no repo import, no migration engine.

## Value

Founders and tech leads can **onboard someone or rebuild an environment** from documented steps tied to real assets, vault ref labels, and emails—without pasting secrets into Hilko.

## Primary user stories

1. I pick **New developer onboarding** for a project + environment and get a runbook with steps filled from inventory (or explicit “pending” callouts).
2. I edit overview and step Markdown, refresh auto blocks from inventory with confirmation, and export a README `.md`.
3. I start an execution (frozen by default), mark steps done/skipped/blocked, and finish with a record of what happened.
4. I find runbooks from **Home**, **Guides**, or the project **Runbooks** tab; checklist q9 deep-links into onboarding for Northline.
5. High-level runbook lifecycle events are written to `audit_events` (no audit UI yet).

## Requirements

- Drizzle tables: `runbook_templates` (seed), `runbooks`, `runbook_steps`, `runbook_executions`, snapshot steps for frozen runs, `runbook_step_results`
- Generator: metadata-only interpolation; pending steps when links missing; export always allowed with header counts
- APIs per slim spec; workspace-scoped; Zod in `shared/schemas/`
- UI: template picker, editor, execution view, export from detail
- i18n EN/ES for templates, nav, export strings
- Audit on create/update/delete/export/execution lifecycle (not per-step marks)
- Dogfood: Northline + `new-developer-onboarding` → credible export; q9 answerable in-app

## Constraints

- `project_id` required on runbooks created from template in v0.3.0
- Metadata only (`no-secrets`); no shell execution
- i18n `no_prefix`; custom sessions
- Default execution **snapshot**; optional **live** binding at start only

## Dependencies

- hilko-phase-1 (inventory, envs, vault refs, config entries, audit helper)
- Closed decisions in `product/plans/hilko-phase-2/decisions/`
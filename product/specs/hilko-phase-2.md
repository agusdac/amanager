# Phase 2 — Runbooks & setup README

## Version & scope

**v0.3.0** · Exit: spec **§21**, **§26.B** · ROADMAP Fase 2 · Depends on **v0.2.0**.

## Decisions locked

| # | Gist | Link |
|---|------|------|
| 01 | Full §21 MVP in one release; no repo import / command runner | [01](../plans/hilko-phase-2/decisions/01-runbook-mvp-scope.md) |
| 02 | Templates: `new-developer-onboarding`, `staging-environment-bootstrap`, `access-handover-checklist` | [02](../plans/hilko-phase-2/decisions/02-system-template-catalog.md) |
| 03 | Pending steps when inventory incomplete; export OK; no invented values | [03](../plans/hilko-phase-2/decisions/03-generator-missing-inventory.md) |
| 04 | Copy from template; edit overview + step Markdown; cautious inventory refresh | [04](../plans/hilko-phase-2/decisions/04-runbook-editor-ux.md) |
| 05 | Home card + `/guides` + project Runbooks tab; export on detail; q9 deep link | [05](../plans/hilko-phase-2/decisions/05-guides-navigation.md) |
| 06 | `projectId` required; executions per runbook; list filterable | [06](../plans/hilko-phase-2/decisions/06-runbook-project-binding.md) |
| 07 | Default **snapshot** on execution start; opt-in **live**; export rules per mode | [07](../plans/hilko-phase-2/decisions/07-execution-content-binding.md) |
| 08 | Audit lifecycle + export; not per-step PATCH; no audit UI | [08](../plans/hilko-phase-2/decisions/08-runbook-audit-events.md) |

## User stories & flows

1. **Create:** User opens `/guides/new` (or project tab) → picks template + project (+ environment when required) → API generates runbook + steps from inventory → lands on detail editor.
2. **Edit:** User edits overview Markdown and per-step title/body; may append manual steps; **Refresh from inventory** shows diff preview before merging auto blocks.
3. **Export:** User downloads `.md` from runbook detail; header includes generation time, template slug/version, pending step counts, unverified hints; locale = active i18n (`en` fallback).
4. **Execute:** User starts execution → chooses snapshot (default) or live → marks step states + notes → completes or cancels; history list on runbook.
5. **Discover:** Home **Setup guides** card; Guides list with project/template filters; checklist q9 → prefill Northline onboarding flow.

## Architecture touchpoints

- New migration after F1 schema; seed **system** `runbook_templates` (not workspace rows)
- `server/api/runbooks/*`, `runbook-executions/*`; reuse `recordAudit`
- `shared/schemas/runbooks.ts` (Zod)
- Nav: `nav.guides`, project tab `tabs.projects.runbooks`, home card
- Markdown render: sanitize like existing patterns; export server-side template

## Schema

Global (no `workspace_id`):

- **`runbook_templates`:** `slug`, `version`, `title` (EN default in seed), `schema_jsonb` (required inputs, step definitions), optional `content_markdown` overview pattern

Workspace-scoped:

- **`runbooks`:** `workspace_id`, **`project_id` NOT NULL**, `environment_id` nullable, `template_id` nullable, `title`, `status` (`draft|active|archived`), `overview_markdown`, `version` (instance bump on material regen optional), timestamps
- **`runbook_steps`:** `runbook_id`, `step_key`, `position`, `kind` (`manual|reference|command_suggestion|validation|approval`), `title`, `body_markdown`, `risk`, `depends_on_jsonb` (step keys), `is_required`, `source` (`template|generated|manual`), `hidden_at` nullable (soft-hide)
- **`runbook_executions`:** `runbook_id`, `started_by`, `status` (`in_progress|completed|cancelled`), **`content_binding`** (`snapshot|live`), `started_at`, `completed_at`
- **`runbook_execution_steps`** (snapshot rows): `execution_id`, `step_key`, `position`, `kind`, `title`, `body_markdown`, `risk`, `depends_on_jsonb`, optional `origin_step_id` (live runbook step at snapshot time)
- **`runbook_step_results`:** `execution_id`, **`execution_step_id`** when `content_binding=snapshot`, else **`runbook_step_id`** when live; `status` (`todo|blocked|in_progress|done|skipped|failed`), `result_note`, `completed_at`

Indexes: `workspace_id`, `project_id`, `runbook_id`, `execution_id`. Composite FK discipline same as F1.

**Not in v0.3.0:** `migration_*` tables, runbook immutable version history UI.

## API

All routes session-scoped; reject cross-workspace IDs.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/runbook-templates` | List system templates (slug, title i18n, required inputs) |
| GET | `/api/runbooks` | List; query `projectId`, `templateSlug`, `status` |
| POST | `/api/runbooks/from-template` | Body: `templateSlug`, `projectId`, `environmentId?`, `title?` → generate + audit `create` |
| GET | `/api/runbooks/:id` | Detail + steps |
| PATCH | `/api/runbooks/:id` | Title, status, overview; audit `update` |
| POST | `/api/runbooks/:id/refresh-inventory` | Regenerate auto blocks; returns diff for UI confirm |
| POST | `/api/runbooks/:id/steps` | Add manual step |
| PATCH | `/api/runbooks/:id/steps/:stepId` | Edit/hide step |
| DELETE | `/api/runbooks/:id` | Archive/delete; audit |
| GET | `/api/runbooks/:id/export.md` | Download; audit `export` |
| POST | `/api/runbooks/:id/executions` | Body: `contentBinding?` default `snapshot`; audit `start` |
| GET | `/api/runbook-executions/:id` | Execution + steps + results |
| PATCH | `/api/runbook-executions/:id` | Complete/cancel; audit |
| PATCH | `/api/runbook-executions/:id/steps/:stepRef` | Update step result (`stepRef` = snapshot id or live step id) |
| GET | `/api/runbook-executions/:id/export.md` | Per decision 07 |

Dashboard/home may extend existing workspace summary with runbook + in-progress execution counts.

## Generator rules

- Input: template step defs + project assets/env links + identities/roles + vault ref labels + config entry keys/`public_value` only
- Missing link → step body includes **Pending in inventory** + deep link path
- `unverified` → softer hint; still exportable
- DAG: detect cycles on save; preserve template `depends_on` unless user edits keys
- Allowed template variables: `{{project.name}}`, `{{environment.name}}`, asset/identity labels, vault ref labels — **never** secret-shaped values
- Post-create refresh merges only steps marked `source=generated` unless user confirms broader merge (decision 04)

## Behaviors

1. **Given** Northline seed, **when** user creates `new-developer-onboarding` with project + dev environment, **then** runbook has ≥1 step with real repo/admin URLs or explicit pending callouts.
2. **Given** missing GitHub asset, **when** generator runs, **then** related step shows pending block and export header counts pending steps; export is not blocked.
3. **Given** user edits step body, **when** refresh from inventory without accepting diff, **then** user Markdown unchanged.
4. **Given** execution started with default binding, **when** user edits runbook steps, **then** in-progress execution instructions unchanged until user starts a new execution.
5. **Given** execution `live`, **when** step body changes after start, **then** UI shows current body and “updated since start” when `updated_at > started_at`.
6. **Given** export, **when** download completes, **then** file contains no interpolated secrets; audit `runbook.export` with locale + source.
7. **Given** workspace B session, **when** GET workspace A runbook UUID, **then** 404.
8. **Given** checklist q9, **when** user follows deep link, **then** template picker opens with onboarding + Northline project when seed present.

## Build tickets

### OR-2a — Schema + template seed

- **Goal:** Runbook tables + migration; seed 3 system templates with `schema_jsonb` step defs.
- **Deps:** F1 merged
- **Done means:** `bun run db:migrate` applies; seed includes three slugs from decision 02.
- **Checklist:**
  - [ ] Drizzle schema + SQL migration
  - [ ] Seed `runbook_templates` (global)
  - [ ] Shared enums/kinds aligned with spec §9

### OR-2b — Template list + from-template generator API

- **Goal:** `GET runbook-templates`, `POST runbooks/from-template` with inventory generator (pending rules).
- **Deps:** OR-2a
- **Done means:** Creating from template persists runbook + steps; `projectId` required; audit create.
- **Checklist:**
  - [ ] Generator module (pure functions + tests)
  - [ ] Zod request/response schemas
  - [ ] Workspace validation on project/env

### OR-2c — Runbook CRUD + editor APIs

- **Goal:** GET/PATCH runbook, step CRUD/hide, overview, refresh-inventory with diff payload.
- **Deps:** OR-2b
- **Done means:** User can edit Markdown and manual steps; refresh does not overwrite without confirmed merge.
- **Checklist:**
  - [ ] PATCH/POST/DELETE step routes
  - [ ] Refresh endpoint + merge policy
  - [ ] Audit on update/delete

### OR-2d — Markdown export

- **Goal:** `export.md` for runbook (and execution stub for OR-2e).
- **Deps:** OR-2c
- **Done means:** Locale-aware header + steps; pending/unverified summary; audit export.
- **Checklist:**
  - [ ] Server renderer (no secret interpolation)
  - [ ] Filename convention `SETUP_<project-slug>.md` or similar
  - [ ] i18n strings for export boilerplate

### OR-2e — Executions (snapshot + live)

- **Goal:** Start/complete/cancel; step results; snapshot copy on start; live binding behavior.
- **Deps:** OR-2c
- **Done means:** Default snapshot frozen; live opt-in; execution export per decision 07.
- **Checklist:**
  - [ ] POST/PATCH execution routes
  - [ ] `runbook_execution_steps` population on snapshot start
  - [ ] Orphaned step UI contract documented in API types
  - [ ] Audit start/complete/cancel

### OR-2f — Guides UI + navigation

- **Goal:** Home card, `/guides`, project Runbooks tab, template picker, editor, execution UI, export button.
- **Deps:** OR-2d, OR-2e
- **Done means:** All surfaces from decision 05; filters on list.
- **Checklist:**
  - [ ] Routes + i18n keys
  - [ ] q9 deep link from `/checklist`
  - [ ] Reuse existing layout/components patterns

### OR-2g — Tests + dogfood hooks

- **Goal:** Tenant isolation on runbook routes; generator unit tests (pending, no-invent); optional snapshot test on export shape.
- **Deps:** OR-2b, OR-2e
- **Done means:** CI vitest green; DOGFOOD q9 hint updated to point at Guides.
- **Checklist:**
  - [ ] Cross-workspace denial
  - [ ] Generator fixtures with Northline-like IDs
  - [ ] Update checklist copy in `en.json`/`es.json`

---

## Suggested implementation order

```text
OR-2a → OR-2b → OR-2c → OR-2d + OR-2e (parallel) → OR-2f → OR-2g
```

**First OR to execute:** **OR-2a** (schema + template seed).

Handoff: say **“fire OR-2a”** or **“implement F2”** to start code; use skills `domain-model`, `no-secrets`, `i18n-en-es`, `nuxt-drizzle-stack` (add `runbook-author` when created).
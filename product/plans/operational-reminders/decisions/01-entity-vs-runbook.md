## Question

Do operational reminders live as a **new first-class entity** (`operational_notes` or similar), or as a **lightweight mode inside runbooks** (e.g. pinned “micro-runbook” per asset)?

## Done means

We have a written decision with rationale: what we store in the DB, how it differs from `runbooks` / `runbook_executions`, and what we deliberately do **not** reuse from the runbook generator.

## Type

grilling

## Status

closed

## Claimed by

none

## Blocked by

none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**New first-class entity** (shipped as table **`actions`**, UI **Acciones**), workspace-scoped, separate from runbooks.

| | Runbooks (Phase 2) | Operational reminders (v0.3.1) |
|---|-------------------|--------------------------------|
| Purpose | Onboarding, handover, exportable README | Personal/team “how I connect again” |
| Lifecycle | Draft → generate → execute → history | Write once → read often |
| Binding | Project (+ env) required | Asset, project, and/or workspace-global |
| Steps / state | DAG, assignees, completion | No execution state in v1 (optional local checkboxes later) |

Do **not** model as micro-runbooks: avoids execution UI, template catalog, and “pending inventory” noise for a 5-line SSH pattern.

Release slot: **v0.3.1** (*Operational memory*), before Phase 3 migration plans.
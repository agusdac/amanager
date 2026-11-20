## Question

What does “asignaciones de responsables” mean in v0.4.0?

## Done means

Schema + API + minimal UI exist for optional workspace-member assignees on verifications and runbook steps (template default + per-execution override).

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [02-mvp-first-slice](./02-mvp-first-slice.md)
- [06-permission-matrix](./06-permission-matrix.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Minimal dual surface** (same v0.4.0, **after slice 1**, before or parallel to slice 2 copy preview).

### 1) Verifications

- Add nullable `verifications.assignee_user_id` → `users.id`.
- Assignee must be a **current member** of the verification’s workspace (validate on write).
- **editor+** may set/clear assignee; **viewer** read-only.
- Shown in verification UI / impact surfaces as a name (no email in exports unless already present elsewhere).

### 2) Runbooks

- **Template:** nullable `runbook_steps.default_assignee_user_id` (workspace member).
- **Execution:** nullable `runbook_execution_steps.assignee_user_id`; on execution start, copy default from origin step when present.
- **editor+** may change assignee on live execution steps (not blocked if assignee left workspace — show “former member” stub).
- No notifications / @mentions in v0.4.0.

### Permissions

Same as parent entity edit rules ([06](./06-permission-matrix.md)).

### Offboarding tie-in ([09](./09-offboarding.md))

When admin removes a member (or member leaves), **no auto-reassign**. Member management UI shows **warning counts**: open verifications + open execution steps still assigned to that user; admin may bulk-clear or reassign manually before remove (v0.4.0: **clear-only** bulk is enough; per-row reassign optional stretch).

### Out of scope

- Project-level owner, asset assignee, agency client roles, due dates, Slack/email alerts.

## Implementation note

FK to `users` not `workspace_members` so historical assignees survive after leave; membership validated only at assignment time.
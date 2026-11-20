## Question

What audit / history do we ship in v0.4.0 for team collaboration?

## Done means

We know which events are recorded and whether admins can view them in-app.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [02-mvp-first-slice](./02-mvp-first-slice.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Minimal admin feed** (no full audit product).

### Recording (extend existing `recordAudit`)

Keep `safe_diff_json` metadata-only; never store secrets. Add actions in v0.4.0:

| Action | entity_type (examples) | When |
| --- | --- | --- |
| `workspace.create` | `workspace` | Team workspace created |
| `workspace.rename` | `workspace` | |
| `workspace.delete` | `workspace` | |
| `member.invite` | `workspace_invite` | Sent / resent |
| `member.invite_revoke` | `workspace_invite` | |
| `member.join` | `workspace_member` | Accept invite |
| `member.leave` | `workspace_member` | Self leave |
| `member.remove` | `workspace_member` | Admin remove |
| `member.role_change` | `workspace_member` | |
| `session.workspace_switch` | `workspace` | User switched active workspace (actor only, same workspace id as target) |
| `project.copy` | `project` | Personal → team copy committed (on **target** workspace) |

Existing inventory/runbook audit events continue unchanged.

### UI

- **Team workspace settings** → section **Activity** (EN) / **Actividad** (ES).
- Visible to **admin + owner** only ([06](./06-permission-matrix.md)).
- **Last 50 events** in target workspace, reverse chronological; **paginate** with cursor `?before=` for next 50 (no fancy filters in v0.4.0).
- Each row: timestamp, actor display name, action label (i18n), entity type + short label (project name, member email hash or masked email last segment — avoid leaking invite email to non-involved viewers; show target role on join).
- **No** export, no global search, no diff viewer (safe summary line only if present).

### API

- `GET /api/workspaces/:id/audit-events?limit=50&before=` — workspace-scoped, admin+owner, 404 cross-workspace.

### Out of scope v0.4.0

- Retention policy UI, webhooks, viewer read access, per-entity history tabs, SIEM export.
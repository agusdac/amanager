## Question

In what order are v0.4.0 OR-* / vertical slices delivered?

## Done means

Fire-in-the-hole can open tickets in sequence without blocking dependencies.

## Type

task

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [02-mvp-first-slice](./02-mvp-first-slice.md)
- [10-assignees](./10-assignees.md)
- [11-copy-preview-redaction](./11-copy-preview-redaction.md)
- [12-audit-collaboration](./12-audit-collaboration.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

Validated **recommended** stack (same v0.4.0 release):

| Order | Working name | Scope | Depends on |
| --- | --- | --- | --- |
| **1** | `OR-F4-session-workspaces` | Session binds active `workspace_id`; list memberships; switcher shell; personal + team types; 404 isolation unchanged | — |
| **2** | `OR-F4-teams-invites-roles` | Team CRUD; invites send/accept/resend ([03](./03-invite-flow.md), [07](./07-invite-expiry.md)); `workspace_members` roles; `requireWorkspaceRole` from [06](./06-permission-matrix.md); signup flag [08](./08-signup-policy.md); offboarding rules [09](./09-offboarding.md); `projects.created_by_user_id` | 1 |
| **3** | `OR-F4-assignees` | Schema + UI/API assignees [10](./10-assignees.md); offboarding warning counts | 2 |
| **4** | `OR-F4-project-copy` | Preview + commit [05](./05-project-copy-preview.md) + [11](./11-copy-preview-redaction.md) | 1, 2 |
| **5** | `OR-F4-audit-activity` | Collaboration `recordAudit` actions + settings Activity feed [12](./12-audit-collaboration.md) | 2 |

**Parallelism:** 3 and 4 may run in parallel after 2 completes. **5** last so events exist for invites/copy.

**Release gate:** two-user acceptance — personal A copies project to team T; user B (viewer) cannot mutate; admin invites C; switcher shows no cross-workspace data.

## Note

Slice labels in [02](./02-mvp-first-slice.md) remain valid: OR 1–2 ≈ **slice 1**; OR 4 ≈ **slice 2**; OR 3 and 5 are supporting columns in the same version.
## Question

What is the v0.4.0 permission matrix for `owner|admin|editor|viewer` on team workspaces (API-enforced)?

## Done means

Implementers can add a single `requireWorkspaceRole()` (or equivalent) per route family without reopening product debate; acceptance tests map to §22-style cases.

## Type

grilling

## Status

closed

## Claimed by

user + agent (2026-11-20)

## Blocked by

- [04-role-enforcement](./04-role-enforcement.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

### Scope

- Applies to **team** workspaces only (personal workspace: sole member is **owner** with full access).
- **403** when role insufficient; **404** when resource is another workspace (unchanged).
- UI mirrors API (hide/disable actions); never rely on UI alone.

### Membership & workspace

| Action | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- |
| View workspace, switch into it | yes | yes | yes | yes |
| Create team workspace | — | yes (becomes owner of new team) | yes | yes |
| Rename team workspace | no | no | yes | yes |
| Delete team workspace | no | no | no | yes |
| List members | yes | yes | yes | yes |
| Invite member | no | no | yes | yes |
| Revoke / change member role | no | no | yes | yes |
| Remove self (leave) | yes | yes | yes | [must promote another owner first](./09-offboarding.md) |

### Projects & environments

| Action | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- |
| List / view project | yes | yes | yes | yes |
| Create project | no | yes | yes | yes |
| Update project metadata | no | yes | yes | yes |
| Delete project | no | **only if `created_by_user_id = self`** | yes | yes |
| Manage environments | no | yes | yes | yes |

**Schema:** add `projects.created_by_user_id` (nullable → backfill owner) in v0.4.0 for editor delete rule.

### Inventory (assets, identities, emails, accounts, deps, config, vault refs, verifications)

| Action | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- |
| Read (incl. search, impact, graph) | yes | yes | yes | yes |
| Create / update | no | yes | yes | yes |
| Delete | no | yes | yes | yes |
| Import CSV commit | no | yes | yes | yes |
| Export assets CSV | **yes** | yes | yes | yes |
| Patch verification status | no | yes | yes | yes |
| PATCH asset_roles (provider roles) | no | **no** (spec §22) | yes | yes |

### Runbooks (guides)

| Action | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- |
| List / read / preview MD | yes | yes | yes | yes |
| Create / edit runbook & steps | no | yes | yes | yes |
| Start execution, update step status | no | yes | yes | yes |
| Delete runbook | no | yes | yes | yes |
| Export runbook / execution `.md` | **yes** | yes | yes | yes |

### Sharing (slice 2)

| Action | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- |
| Start copy personal → team preview | no | yes (from own personal) | yes | yes |
| Confirm copy into **this** team | no | no | yes | yes |

Copy always runs from user’s **personal** workspace into a **team** they belong to with ≥ editor.

### Account / danger

| Action | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- |
| Delete own user account | yes (only self) | yes | yes | yes |
| Delete another member’s data | no | no | no | no |

### Acceptance anchors (tests)

- Viewer `PATCH` verification → **403**.
- Viewer `GET` export assets CSV → **200**.
- Editor `DELETE` project they did not create → **403**.
- Editor `DELETE` project they created → **204**.
- Admin `POST` invite → **201**; editor `POST` invite → **403**.

## Follow-ups (not blocking matrix)

- Offboarding: revoke vs transfer ([07+](../map.md))
- Audit UI vs write-only events
# Phase 4 — Team collaboration

## Version & scope

**v0.4.0** · Exit: spec **§14** · ROADMAP Fase 4 (before F3) · Depends on **v0.3.0**.

**Release gate:** User A (personal) copies a project to team T; user B (viewer in T) cannot mutate; admin invites C; switcher never leaks other workspaces’ data.

## Decisions locked

| # | Gist | Link |
|---|------|------|
| 01 | Personal + team workspaces; switcher; copy personal→team with preview | [01](../plans/hilko-phase-4/decisions/01-workspace-collaboration-model.md) |
| 02 | Slice 1: teams+invites+roles; slice 2: copy preview | [02](../plans/hilko-phase-4/decisions/02-mvp-first-slice.md) |
| 03 | Email invite; register or login + accept | [03](../plans/hilko-phase-4/decisions/03-invite-flow.md) |
| 04 | Baseline roles; fine rules in matrix | [04](../plans/hilko-phase-4/decisions/04-role-enforcement.md) |
| 05 | Categorized preview; user excludes rows | [05](../plans/hilko-phase-4/decisions/05-project-copy-preview.md) |
| 06 | Full API permission matrix | [06](../plans/hilko-phase-4/decisions/06-permission-matrix.md) |
| 07 | Invite TTL 7 days; resend rotates token | [07](../plans/hilko-phase-4/decisions/07-invite-expiry.md) |
| 08 | Open register default; env flag; invite-gated register | [08](../plans/hilko-phase-4/decisions/08-signup-policy.md) |
| 09 | Owner must promote before leave; owner-only grants owner | [09](../plans/hilko-phase-4/decisions/09-offboarding.md) |
| 10 | Assignees on verifications + runbook steps | [10](../plans/hilko-phase-4/decisions/10-assignees.md) |
| 11 | Preview flags, scanner blocks, extra confirm | [11](../plans/hilko-phase-4/decisions/11-copy-preview-redaction.md) |
| 12 | Admin Activity feed + collaboration audit actions | [12](../plans/hilko-phase-4/decisions/12-audit-collaboration.md) |
| 13 | OR-F4-1 … OR-F4-5 order | [13](../plans/hilko-phase-4/decisions/13-implementation-order.md) |

## User stories & flows

1. **Teams:** User creates team workspace (becomes owner) → invites by email + role → invitee accepts via link → appears in switcher.
2. **Switch:** User picks workspace from shell → session `workspace_id` updates → all list/detail routes scoped; audit `session.workspace_switch`.
3. **Roles:** Viewer exports MD/CSV; editor edits inventory; admin invites; owner deletes workspace or promotes owner.
4. **Copy:** From personal, user opens copy wizard → target team → preview by category → toggles rows → extra confirm if flagged → admin/owner confirms → new project in team.
5. **Assign:** Editor sets verification assignee or runbook step default; execution copies default; admin sees assignee counts before remove.
6. **Activity:** Admin opens team settings → Activity → paginated events.

## Architecture touchpoints

- Extend `server/utils/session.ts` — active workspace from session row + membership validation (not hardcoded `personal` only).
- New `server/utils/workspace-auth.ts` (or similar): `requireWorkspaceRole(session, minRole)`, role ordering.
- Email: invite template via Mailpit (dev); link to `/invites/accept?token=`.
- Reuse `recordAudit`, `secret-scan` for copy preview/commit.
- Shell: workspace switcher component; team settings (members, invites, activity).
- Zod: `shared/schemas/workspaces.ts`, `shared/schemas/project-copy.ts`.

## Schema

**New / altered tables (migration after v0.3.0):**

- **`workspace_invites`:** `id`, `workspace_id`, `email`, `role`, `token_hash`, `invited_by_user_id`, `expires_at`, `revoked_at`, `accepted_at`, `created_at`
- **`projects`:** add `created_by_user_id` → `users.id` (backfill owner/migration default)
- **`verifications`:** add nullable `assignee_user_id` → `users.id`
- **`runbook_steps`:** add nullable `default_assignee_user_id`
- **`runbook_execution_steps`:** add nullable `assignee_user_id`
- **`sessions` (or user prefs):** persist `active_workspace_id` if not already on session row

**Existing:**

- `workspaces.type` — enforce `personal|team` in API; personal auto on register unchanged.
- `workspace_members.role` — `owner|admin|editor|viewer`.

Indexes: invite token hash unique; invites by `workspace_id` + `email`.

## API

All routes session-authenticated. Cross-workspace IDs → **404**. Insufficient role → **403**.

| Method | Path | Role (min) | Purpose |
|--------|------|------------|---------|
| GET | `/api/me/workspaces` | member | List workspaces + role + type |
| POST | `/api/workspaces` | auth user | Create team (`type=team`); audit create |
| PATCH | `/api/workspaces/:id` | admin+ | Rename team |
| DELETE | `/api/workspaces/:id` | owner | Delete team |
| POST | `/api/workspaces/:id/switch` | member | Set active workspace; audit switch |
| GET | `/api/workspaces/:id/members` | viewer+ | List members |
| PATCH | `/api/workspaces/:id/members/:userId` | admin+ / owner for owner role | Change role |
| DELETE | `/api/workspaces/:id/members/:userId` | admin+ / self leave | Remove or leave |
| GET | `/api/workspaces/:id/invites` | admin+ | Pending invites |
| POST | `/api/workspaces/:id/invites` | admin+ | Send/resend (+7d TTL) |
| DELETE | `/api/workspaces/:id/invites/:inviteId` | admin+ | Revoke |
| GET | `/api/invites/accept` | public | Validate token (metadata) |
| POST | `/api/invites/accept` | auth | Accept; email must match invite |
| POST | `/api/projects/:id/copy/preview` | editor+ personal + member target | Body: `targetWorkspaceId`; categorized rows |
| POST | `/api/projects/:id/copy/commit` | admin+ target | Body: selected row ids; re-scan |
| PATCH | `/api/verifications/:id` | editor+ | Include assignee fields |
| PATCH | `/api/runbooks/:id/steps/:stepId` | editor+ | Include default assignee |
| PATCH | `/api/runbook-executions/:id/steps/:stepRef` | editor+ | Execution assignee |
| GET | `/api/workspaces/:id/audit-events` | admin+ | Activity feed |

**Auth register:** honour `HILKO_ALLOW_PUBLIC_REGISTER`; allow register with valid `invite` token when public register off ([08](../plans/hilko-phase-4/decisions/08-signup-policy.md)).

Existing inventory/runbook routes: wrap mutators with `requireWorkspaceRole` per [06](../plans/hilko-phase-4/decisions/06-permission-matrix.md) (e.g. viewer cannot `PATCH` verification; editor cannot `DELETE` others’ projects).

## Copy preview (summary)

Per [11](../plans/hilko-phase-4/decisions/11-copy-preview-redaction.md): categories (project, envs, assets, links, identities, emails, deps, config, vault, roles, verifications, runbooks); flagged rows included by default; extra confirm if any flagged still selected; `secret-scan` **blocked** rows omitted from commit; assignees cleared on copy; audit on target workspace.

## Behaviors

1. **Given** user member of personal P and team T, **when** switch to T, **then** project list shows only T data.
2. **Given** user B viewer in T, **when** `PATCH` asset, **then** 403.
3. **Given** user B viewer in T, **when** GET assets CSV export, **then** 200.
4. **Given** editor created project X, **when** `DELETE` X, **then** 204; **when** `DELETE` project created by admin, **then** 403.
5. **Given** sole owner, **when** leave team, **then** 400 until another owner exists.
6. **Given** invite expired, **when** accept, **then** 410/400 `invite_expired`.
7. **Given** invite valid, **when** accept with different session email, **then** 403.
8. **Given** preview row blocked by scanner, **when** commit includes that id, **then** 400.
9. **Given** flagged email row selected, **when** commit without extra confirm flag, **then** 400.
10. **Given** workspace A session, **when** GET workspace B project UUID, **then** 404.
11. **Given** admin, **when** Activity feed, **then** sees `member.invite` and `project.copy` with safe labels only.
12. **Given** public register disabled, **when** register without invite token, **then** 403; **with** valid invite, **then** 201.

## Build tickets

### OR-F4-1 — Session & workspace switcher

- **Goal:** Multi-workspace session; list memberships; shell switcher; team type allowed.
- **Deps:** none
- **Done means:** User with two memberships can switch; queries use active id; strangers get 404 on foreign UUIDs.
- **Checklist:**
  - [ ] Session `active_workspace_id` persistence + validation
  - [ ] GET `/api/me/workspaces`, POST switch
  - [ ] Switcher UI + i18n
  - [ ] Stop filtering session to `personal` only

### OR-F4-2 — Teams, invites, roles

- **Goal:** Team CRUD, invites lifecycle, role enforcement helper, `created_by_user_id`, signup flag, offboarding guards.
- **Deps:** OR-F4-1
- **Done means:** Two users collaborate in team with matrix enforced on key routes; invite 7d + resend.
- **Checklist:**
  - [ ] `workspace_invites` migration
  - [ ] Invite email + accept routes
  - [ ] Members CRUD + promote owner rules
  - [ ] `requireWorkspaceRole` on inventory/runbook mutators
  - [ ] `HILKO_ALLOW_PUBLIC_REGISTER` + invite register path
  - [ ] Backfill `projects.created_by_user_id`

### OR-F4-3 — Assignees

- **Goal:** Assignee columns + PATCH surfaces + remove-member warning counts.
- **Deps:** OR-F4-2
- **Done means:** Editor assigns verification and runbook step; warnings on remove.
- **Checklist:**
  - [ ] Migration assignee columns
  - [ ] API validation (workspace member)
  - [ ] UI pickers (member list)
  - [ ] Offboarding warning API/UI

### OR-F4-4 — Project copy

- **Goal:** Preview + commit personal → team with flags/scanner/confirm.
- **Deps:** OR-F4-1, OR-F4-2
- **Done means:** Copy creates isolated rows in team; blocked secrets cannot ship.
- **Checklist:**
  - [ ] Preview POST with categories + closure
  - [ ] Commit transaction + remap FKs
  - [ ] Wizard UI + i18n confirm copy
  - [ ] `project.copy` audit

### OR-F4-5 — Activity audit

- **Goal:** Collaboration audit actions + admin feed UI.
- **Deps:** OR-F4-2 (after invites/copy emit events)
- **Done means:** Admin sees last 50 events with pagination.
- **Checklist:**
  - [ ] `recordAudit` calls on collaboration actions
  - [ ] GET audit-events
  - [ ] Team settings Activity section + i18n

## Suggested implementation order

```text
OR-F4-1 → OR-F4-2 → (OR-F4-3 ∥ OR-F4-4) → OR-F4-5
```

**First OR to execute:** **OR-F4-1** (session & switcher).

Handoff: say **“fire OR-F4-1”** or **“implement F4”** with [fire-in-the-hole](../.cursor/skills/fire-in-the-hole/SKILL.md). Skills: `domain-model`, `no-secrets`, `i18n-en-es`, `nuxt-drizzle-stack`.
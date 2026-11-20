# hilko-phase-4 — Team collaboration

## Version

**v0.4.0** (unreleased) — spec **§14 Fase 4** on top of v0.3.0; **F3 migrations deferred** to v0.5.0.

## Plan

- [Map](../plans/hilko-phase-4/map.md)
- [Slim spec](../specs/hilko-phase-4.md)
- [Phase 2 prerequisite](../features/hilko-phase-2.md) (inventory + runbooks)

## Description

Each user keeps a **personal** workspace and can create or join **team** workspaces with `owner|admin|editor|viewer` roles. A workspace switcher scopes the session; invites arrive by email (7-day TTL). Admins can copy a **project** from personal → team through a categorized **preview** (vault refs, emails, flagged metadata). Optional assignees on verifications and runbook steps; minimal **Activity** audit feed for admins.

## Value

Two people (e.g. founder + contractor) collaborate on the same inventory **without sharing passwords in Hilko** and **without seeing each other’s personal workspaces**. Sharing is deliberate: preview, exclude rows, confirm flagged items.

## Primary user stories

1. I create a team workspace, invite a colleague as editor, and switch between personal and team in the shell.
2. As viewer I read inventory and export runbook MD + assets CSV; I cannot change verification status or invite others.
3. As admin I copy my personal Northline project into the team with preview, uncheck sensitive emails, and confirm flagged vault refs.
4. I assign a verification or runbook step to a teammate; when removing a member I see warnings for open assignees.
5. As admin I review the last workspace Activity events (invites, role changes, project copy).

## Requirements

- Session active `workspace_id`; list memberships; switcher; `workspaces.type` `personal|team`
- `workspace_invites` + accept flow (register/login); resend; expiry 7d; `HILKO_ALLOW_PUBLIC_REGISTER`
- `requireWorkspaceRole` on mutating routes per decision matrix; `projects.created_by_user_id`
- Project copy preview + commit with `secret-scan` blocks; assignees columns; collaboration audit events + Activity UI
- i18n EN/ES for collaboration surfaces
- Two-user acceptance gate per implementation order decision

## Constraints

- Metadata only (`no-secrets`); cross-workspace access → **404**
- Custom sessions; i18n `no_prefix`
- No Fase 5 agency, no migration engine, no billing

## Dependencies

- hilko-phase-2 (runbooks, audit helper, exports)
- Closed decisions `product/plans/hilko-phase-4/decisions/01`–`13`
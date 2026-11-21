# actions — Acciones & favoritos

## Version

**v0.3.1** (unreleased) — *Operational memory* slice after **v0.3.0** runbooks, **before** Phase 3 migration and independent of **v0.4.0** teams.

## Plan

- [Map](../plans/operational-reminders/map.md)
- [Slim spec](../specs/actions.md)
- [Pre-consolidate UX notes](../plans/operational-reminders/assets/pre-consolidate-ideas.md)

## Description

**Acciones** are short markdown notes (“how I do this again”: SSH, Docker, checklists) anchored to a **resource**, **project**, or **workspace**. They are not runbooks: no generator, execution, or export flow.

Each user can **star** resources, identities, emails, and actions into **Accesos rápidos** on **Home** and in the **sidebar** (same list, drag reorder, optional project filter default **off**).

## Value

Daily ops stop living in sticky notes and scattered shells. One starred VPS + SSH action is readable and copyable in seconds without opening a full guide or hunting inventory fields.

## Primary user stories

1. I open my VPS, tab **Acciones**, read the SSH block, and copy the command.
2. I star the VPS and the “SSH from laptop” action; both appear on Home and in the sidebar in the order I drag.
3. I add a project-level checklist before publishing YouTube; it stays separate from onboarding runbooks.
4. I follow a favorite action and land in read view; for assets I can share `/assets/:id?openAction=<uuid>`.

## Requirements

- Table `actions` + CRUD scoped to active workspace; exactly one anchor per row (asset XOR project XOR global).
- Fields: `title`, `body_markdown`, optional `pinned`, optional `kind` (`command` | `checklist` | `reference`) for icon only.
- **Insertar del activo** on asset edit; copy per code block in read view; secret scan on save.
- Table `workspace_favorites` per user + workspace; types `asset` | `identity` | `email_address` | `action`.
- Star toggles on list/header surfaces; `GET /api/me/favorites`, reorder `PATCH`, toggle POST/DELETE.
- Home card + `AppShell` quick-access block; type icons; “Solo este proyecto” toggle (default off).
- Tabs **Acciones** on asset and project; workspace list `/actions` with filter chips.
- i18n EN/ES for `actions.*`, `favorites.*`.

## Constraints

- Workspace-scoped; cross-tenant IDs → **404**; metadata only ([no-secrets](../../.cursor/skills/no-secrets/SKILL.md)).
- No credential storage, command execution, or runbook merge in v1.
- Favorites only for targets the user can already read.

## Dependencies

- **v0.2.0** inventory (assets, projects, identities, emails).
- **v0.3.0** runbooks remain separate; no schema coupling.
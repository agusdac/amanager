# v0.3.1 — Operational memory

Short **Acciones** notes on resources, projects, and workspace, plus per-user **favorites** on Home and in the sidebar.

## Scope

- After **v0.2.0** inventory and alongside **v0.3.0** runbooks (separate feature)
- Before Phase 3 migration engine; does not depend on **v0.4.0** teams
- Build order: [spec OR-31a … OR-31h](../specs/actions.md#build-tickets)

## Features

- [actions](../features/actions.md)

## In scope

- `actions` + `workspace_favorites` tables and APIs
- Asset/project tabs, workspace `/actions` list
- Quick access: Home card + sidebar, drag reorder, optional project filter (default off)
- Insert-from-asset, copy code blocks, secret scan on save
- Asset URL `?openAction=`

## Out of scope

- Runbook execution, template generation, or wiki-scale docs
- Team-wide pins, automatic recents, persisted checklist state
- Command runner and credential storage
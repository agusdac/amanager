# v0.4.0 — Team collaboration

Personal and team workspaces, invites and roles, workspace switcher, assignees, deliberate project copy with preview, and an admin Activity feed.

## Scope

- Fase 4 per [docs/ROADMAP.md](../../docs/ROADMAP.md) (OR-F4-1 … OR-F4-5)
- Exit: spec **§14**
- Depends on **v0.3.0** (inventory + runbooks)
- **Fase 3 migrations** → proposed **v0.5.0**

## Features

- [hilko-phase-4](../features/hilko-phase-4.md)

## In scope

- `owner|admin|editor|viewer` on team workspaces
- Email invites (7-day TTL), open register with optional env lockdown
- Personal → team **project copy** with categorized preview and secret scanner
- Verification + runbook step assignees (minimal)
- Collaboration `audit_events` + **Activity** list for admin/owner

## Out of scope (F5+)

Agency clients UI, billing, migration plan engine, provider integrations, full audit product (filters/export/SIEM).
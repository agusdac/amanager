# v0.3.2 — Inventory import refresh

Bulk inventory load and **export → edit → re-import** with preview, duplicate choices, project-scoped targets (including new project), and expanded entity coverage — **before Phase 3 migration**.

## Scope

- After **v0.3.1** operational memory; does not require **v0.4.0** teams
- Prepares trustworthy inventory for Phase 3 migration **plans** (not repo import / not plan execution)

## Features

- [inventory-import](../features/inventory-import.md) — [spec](../specs/inventory-import.md) · build **OR-32a … OR-32f**

## In scope

- Single import job (bootstrap + round-trip)
- Duplicate detect → skip | merge | create duplicate
- Project focus + “import into new project”
- Multi-entity **ZIP bundle** + single-`assets.csv` simple path; header mapping for Notion/Sheets/Confluence exports
- Multi-entity file contract aligned with export (no vendor OAuth in this release)
- Preview UX, template download, batch revert (extend existing `import_batches`)
- `no-secrets` scan unchanged in spirit

## Out of scope

- GitHub/README repo import (spec V1)
- Migration plan engine (Phase 3)
- Auto-merge without user confirmation

## Plan

- [Decision map](../plans/inventory-import/map.md)
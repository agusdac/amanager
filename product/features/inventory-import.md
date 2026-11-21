# inventory-import — Inventory import refresh

## Version

**v0.3.2** (unreleased) — *Inventory import refresh* after **v0.3.1** actions, **before** Phase 3 migration engine.

## Plan

- [Map](../plans/inventory-import/map.md)
- [Slim spec](../specs/inventory-import.md)
- [External sources research](../plans/inventory-import/assets/05-external-sheet-sources-research.md)

## Description

Replace the developer-only CSV textarea with a **guided import**: upload a **Hilko bundle** (ZIP) or a single **assets.csv**, map columns from Notion/Sheets/Confluence exports, preview creates/updates/skips with **duplicate choices**, respect **project focus** or **new project** target, and **revert** the batch. **Export** emits the same bundle for round-trip.

## Value

Teams already maintain inventory in spreadsheets and wikis. Without a credible import story, Hilko stays manual-only and Phase 3 migration plans lack bulk, trustworthy data. Round-trip export/import makes inventory maintainable at scale without integrations or secrets in the product.

## Primary user stories

1. I download **my Hilko export**, edit in Sheets, re-upload, resolve duplicates with **merge**, and see only the fields that change.
2. I export a **Notion database** to CSV, upload it, **map columns** to Hilko headers, and import into the **project I have focused** in the shell.
3. I choose **“Create new project”**, name it, import a ZIP bundle, and all rows land in that project.
4. I preview shows **secret scan** and **unknown provider** errors before anything commits; I **revert** a bad batch.

## Requirements

- Hilko Import Bundle (ZIP + `manifest.json` + per-entity CSVs); simple **single-file** `assets.csv` path.
- Expanded entity coverage per spec (assets, links, emails, identities, deps, config/vault metadata).
- Duplicate detect → user resolution: skip | merge | create duplicate; commit blocked until resolved.
- Project-scoped defaults + new-project target; strict project column rules when focused.
- Header mapping step for external CSVs; data-source cards (Hilko / Sheet / Notion / Confluence / Other) with i18n recipes.
- Preview UI (tables, summaries, diffs) — not raw JSON.
- Template bundle download; export produces import-compatible ZIP.
- `no-secrets` header/row scan; reject unknown **provider** slugs (no auto-create).
- Batch revert via existing `import_batches` pattern; audit on commit/revert.
- Nav label disambiguates inventory import vs personal project import.

## Constraints

- Workspace-scoped; editor+ for commit; metadata only ([no-secrets](../../.cursor/skills/no-secrets/SKILL.md)).
- No OAuth connectors (Notion/Confluence/Google) in v0.3.2.
- No runbooks, actions, or migration-plan rows in import.

## Dependencies

- **v0.2.0** inventory schema and `import_batches`.
- **v0.3.1** actions unrelated; may ship before or after in release train.
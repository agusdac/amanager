# Map — Inventory import (pre–Phase 3)

## Destination

Before **Phase 3 migration**, operators can load or refresh **full workspace inventory** from structured files: trustworthy preview, duplicate warnings with explicit per-match resolution, project-scoped targets (including **new project**), batch revert, and **no secrets** — with a clear story that data comes from **Hilko export**, **downloadable templates**, or an external spreadsheet mapped to the same contract.

**Contract:** [Feature brief](../../features/inventory-import.md) · [Spec](../../specs/inventory-import.md) · [v0.3.2 overview](../../v0.3.2/overview.md)

## Notes

- **Target version:** `v0.3.2` — *Inventory import refresh* (after **v0.3.1** actions, before Phase 3 migration engine).
- **Slug:** `inventory-import`
- **Skills:** `no-secrets`, `domain-model`, `i18n-en-es`, `minicriptico-dogfood` (§4.4 / Northline), `pathfinder` → `fire-in-the-hole`
- **Forge:** TBD (local twin only until user asks prepare-tea)
- **Plan, don't do** — implementation via fire-in-the-hole OR-* after brief + spec.

## Decisions so far

- [Single import job](./decisions/01-single-import-job.md) — one flow and format for first load **and** export round-trip; not two products.
- [Duplicate resolution](./decisions/02-duplicate-resolution.md) — detect matches, **warn**, user picks **skip | merge | create duplicate** per conflict (not silent insert).
- [Import target scope](./decisions/03-import-target-scope.md) — default **project focus**; optional **create new project** and import all rows there; scoped mode still allows new project as explicit target.
- [CSV and entity coverage](./decisions/04-csv-and-entity-coverage.md) — **expand** beyond today’s 8 asset columns toward **full inventory surface** (assets, links, deps, accounts metadata, config/vault refs without values).
- [File format package](./decisions/05-file-format-package.md) — **ZIP bundle** + `manifest.json` + per-entity CSVs; **single `assets.csv`** simple path for one-table exports.
- [External sheet sources](./decisions/06-external-sheet-sources.md) — Notion/Confluence/Sheets via **CSV export + mapping UX**; **no OAuth connectors** in v0.3.2 ([research](./assets/05-external-sheet-sources-research.md)).
- [Duplicate match & merge](./decisions/07-duplicate-match-and-merge.md) — `external_id` first, else composite key; merge **fill-empty** + allowlist overwrites + preview diff.

## Not yet specified
- **Nav copy:** disambiguate “Importar inventario” vs “Importar desde mi espacio”.
- **Provider auto-create:** import unknown `provider` slug — create stub vs reject row (recommend: reject + preview error).

## Out of scope

- Live **integrations** (Notion API, Confluence REST, Google Drive sync) — v0.3.2 uses exports only
- GitHub/README repo import (spec V1, Phase 3+ integrations)
- Migration **plan execution** engine (Phase 3)
- Storing secret values or columns that fail `secret-scan`
- Automatic duplicate resolution without user choice
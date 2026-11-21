# Inventory import refresh

## Version & scope

**v0.3.2** · Feature slug `inventory-import`

**Release gate:** User downloads Hilko ZIP export, edits `assets.csv` in Sheets, re-imports with **merge** on one duplicate → preview shows field diff → commit succeeds → revert batch restores prior state; Notion CSV uploads via column map without secrets.

Depends on **v0.2.0** inventory; does not require Phase 3 migration engine.

## Decisions locked

| # | Gist | Link |
|---|------|------|
| 01 | One job: bootstrap + export round-trip | [01](../plans/inventory-import/decisions/01-single-import-job.md) |
| 02 | Duplicate: skip \| merge \| duplicate | [02](../plans/inventory-import/decisions/02-duplicate-resolution.md) |
| 03 | Project focus + new-project import | [03](../plans/inventory-import/decisions/03-import-target-scope.md) |
| 04 | Multi-entity inventory surface | [04](../plans/inventory-import/decisions/04-csv-and-entity-coverage.md) |
| 05 | ZIP bundle + single `assets.csv` | [05](../plans/inventory-import/decisions/05-file-format-package.md) |
| 06 | External tools = CSV + mapping only | [06](../plans/inventory-import/decisions/06-external-sheet-sources.md) |
| 07 | Match key + fill-empty merge + diff | [07](../plans/inventory-import/decisions/07-duplicate-match-and-merge.md) |

**Spec defaults (map recommendations):** unknown provider slug → row error in preview; nav **Importar inventario (CSV)** vs existing personal project flow.

## User stories & flows

1. **Round-trip:** User exports ZIP from Hilko → edits CSVs → Import → preview summary → resolve duplicates → commit → optional revert.
2. **Notion/Sheet:** User picks source card → uploads CSV/ZIP → maps headers → preview → commit scoped to focused project.
3. **New project:** User selects “Create new project” + name → upload → rows attach to new project (column `project` optional or must match — normalize in commit).
4. **Scoped strict:** With project focus, rows referencing another project are **errors** unless user clears focus or switches to all projects.
5. **Secrets:** Row or header matches secret patterns → preview fails; commit returns 400.

## Architecture touchpoints

- **Import pipeline:** `server/api/import/preview.post.ts`, `commit.post.ts`, `[batchId]/revert.post.ts` — extend for bundle parse, duplicate graph, resolutions payload.
- **Export:** Replace/extend `server/api/export/assets.get.ts` → `export/inventory.get.ts` (ZIP) matching bundle contract.
- **CSV:** `server/utils/csv.ts`, `server/utils/secret-scan.ts`; new `server/utils/import-bundle.ts`, `server/utils/import-keys.ts`, `server/utils/import-duplicates.ts`.
- **UI:** `app/pages/import/index.vue` wizard (source → upload → map → preview → commit).
- **Scope:** `useWorkspaceScope()` for default target; manifest + UI for new project.
- **i18n:** `import.*`, recipes `import.sources.*` EN/ES.
- **Audit:** `import.commit` / `import.revert` (existing pattern).

## File contract (summary)

See [05](../plans/inventory-import/decisions/05-file-format-package.md).

- ZIP contains `manifest.json` (`formatVersion: 1`) and optional CSVs.
- **Import keys** in CSV (not UUIDs): `project_slug`, `asset_key` (default `provider_slug|asset_type|asset_name` unless `asset_key` column set), similar for emails (`email_address`), identities (`identity_key`), deps (`from_asset_key`, `to_asset_key`, `relation_type`).

### `assets.csv` columns (v1 contract)

| Column | Required | Notes |
|--------|----------|--------|
| `project` / `project_slug` | scoped | Slug or name; inherited from focus/new project |
| `provider` | yes | Known provider slug; unknown → error |
| `asset_type` | yes | `ASSET_TYPE_KEYS` |
| `asset_name` | yes | |
| `asset_key` | no | Stable cross-file reference |
| `external_id` | no | Duplicate match priority |
| `login_email` | no | Creates/links email |
| `environment` | no | Project environment name |
| `admin_url`, `public_url` | no | URLs validated |
| `notes` | no | → `description` |
| `verification_status` | no | Enum if present |

Additional files: `dependencies.csv`, `emails.csv`, `identities.csv`, `asset_emails.csv`, `identity_emails.csv`, `config_entries.csv`, `vault_references.csv`, `environments.csv`, `projects.csv` — columns defined in OR-32b; all subject to secret scan.

## API

Session required; **editor+** on commit/revert.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/export/inventory` | Download Hilko bundle ZIP (query `projectId?` filters export) |
| GET | `/api/import/template` | Empty template ZIP |
| POST | `/api/import/preview` | Body: `{ zipBase64? \| csv?, columnMap?, target: { mode, projectId?, newProjectName? }, resolutions? }` → staged preview id + tables |
| POST | `/api/import/commit` | Body: `{ previewId, resolutions: [...] }` → `batchId` |
| POST | `/api/import/:batchId/revert` | Existing revert |

Preview returns: `summary` (counts), `errors[]`, `duplicates[]` with `matchKey`, `existingId`, `candidateRow`, `suggestedAction?`, `mergeDiff?`, `intraBatchDuplicates[]`.

Commit rejects if any duplicate lacks resolution.

## Behaviors

1. **Given** ZIP with only `assets.csv`, **when** preview, **then** parse succeeds and summary counts rows.
2. **Given** focused project P, **when** row names project Q≠P, **then** preview error on that row.
3. **Given** existing asset with same `(project, provider, type, name)`, **when** preview without resolution, **then** duplicate entry and commit blocked.
4. **Given** duplicate with resolution **merge**, **when** preview diff, **then** show only fill-empty and allowlist overwrites per [07](../plans/inventory-import/decisions/07-duplicate-match-and-merge.md).
5. **Given** row with `api_key` column, **when** preview, **then** batch rejected (header scan).
6. **Given** unknown provider slug, **when** preview, **then** row error (no provider auto-create).
7. **Given** committed batch, **when** revert, **then** created entities from batch removed/restored per existing revert semantics.
8. **Given** Hilko export ZIP unmodified, **when** re-import with all **skip** on duplicates, **then** no net change.
9. **Given** Notion CSV with alien headers, **when** user maps `Servicio`→`asset_name`, **then** preview uses mapped columns.

## Build tickets

### OR-32a — Bundle parse + template/export

- **Goal:** Parse ZIP + manifest; single CSV fallback; export + template endpoints.
- **Deps:** none
- **Done means:** User downloads template ZIP and full export ZIP; parser returns normalized row sets.
- **Checklist:**
  - [ ] `import-bundle.ts`, `formatVersion` guard
  - [ ] `GET /api/import/template`, `GET /api/export/inventory`
  - [ ] Tests: round-trip empty bundle, single `assets.csv`

### OR-32b — Expanded row materialization

- **Goal:** Commit paths for emails, identities, deps, config/vault metadata per CSV files.
- **Deps:** OR-32a
- **Done means:** Northline-sized bundle imports multi-entity without secrets.
- **Checklist:**
  - [ ] Import keys resolve in dependency order
  - [ ] Reuse `inventory-links` helpers
  - [ ] Revert removes batch-tagged rows

### OR-32c — Duplicate detection + resolutions

- **Goal:** Match keys, intra-batch dupes, resolution payload on commit.
- **Deps:** OR-32a
- **Done means:** Preview lists duplicates; commit applies skip/merge/duplicate.
- **Checklist:**
  - [ ] `import-duplicates.ts` per [07](../plans/inventory-import/decisions/07-duplicate-match-and-merge.md)
  - [ ] Merge fill-empty + allowlist
  - [ ] API tests for merge diff

### OR-32d — Import wizard UX

- **Goal:** Replace textarea page with source cards, upload, scoped target, preview tables.
- **Deps:** OR-32a, OR-32c
- **Done means:** Operator completes flow without JSON debug view.
- **Checklist:**
  - [ ] Steps + `ProjectScopeBanner` / new project mode
  - [ ] Duplicate resolution UI
  - [ ] Revert batch UI
  - [ ] i18n EN/ES

### OR-32e — Column mapping + source recipes

- **Goal:** Header mapper; static recipes for Notion/Confluence/Sheet.
- **Deps:** OR-32d
- **Done means:** User maps Notion export headers once per session and sees valid preview.
- **Checklist:**
  - [ ] `columnMap` in preview API
  - [ ] `import.sources.*` copy + links
  - [ ] Delimiter autodetect (`,` / `;`)

### OR-32f — Nav, labels, dogfood

- **Goal:** Disambiguate nav; dogfood §4.4 path documented.
- **Deps:** OR-32d
- **Done means:** Nav says inventory import; checklist mentions bundle path.
- **Checklist:**
  - [ ] `nav.importInventory` vs personal import
  - [ ] Link from Home/stats to import
  - [ ] Vitest critical behaviors 1–7

## Open product questions (map only)

- Named **column-map presets** per workspace; provider auto-create; xlsx template download — not v0.3.2 unless added to map.
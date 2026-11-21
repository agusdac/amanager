## Question

How should multi-entity inventory be **packaged** for upload and export (file shape)?

## Done means

Spec names bundle layout, required vs optional files, encoding, and backward compatibility with today’s single asset CSV; export emits the same bundle.

## Type

grilling

## Status

closed

## Claimed by

—

## Blocked by

- [CSV and entity coverage](./04-csv-and-entity-coverage.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Primary format: Hilko Import Bundle** — a `.zip` containing UTF-8 CSVs plus a small manifest.

| File | Required | Role |
|------|----------|------|
| `manifest.json` | yes | `formatVersion`, optional `targetProject` / `newProjectName`, `source` hint, list of included CSVs |
| `assets.csv` | yes* | Core resources |
| `projects.csv` | no | Only when batch spans projects and not using “new project” UI target |
| `environments.csv` | no | Create envs before asset links |
| `emails.csv` | no | Standalone addresses |
| `identities.csv` | no | Standalone identities |
| `asset_emails.csv` | no | Link rows (asset key + email + purpose) |
| `identity_emails.csv` | no | Link rows |
| `dependencies.csv` | no | `from` / `to` asset keys + relation type |
| `config_entries.csv` | no | Metadata keys only |
| `vault_references.csv` | no | Labels/pointers only |

\* **Simple path (backward compatible):** upload a **single** `assets.csv` only (today’s 8 columns expanded per spec). Preview treats it as a degenerate bundle — no ZIP required. Notion/Confluence “one table” exports land here.

**Stable keys inside a batch:** rows reference each other with **import keys** (`project_slug`, `asset_key` or composite `project|provider|type|name`) defined in spec — not Hilko UUIDs (unknown on first load).

**Export:** same ZIP layout Hilko generates after commit; round-trip is the conformance test.

**Not chosen:** one 40-column “god sheet”; Excel `.xlsx` as canonical (CSV inside ZIP remains source of truth; optional future xlsx download is convenience only).
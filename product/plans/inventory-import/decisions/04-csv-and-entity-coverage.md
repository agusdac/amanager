## Question

How far should import expand beyond the current 8-column asset CSV?

## Done means

Brief lists entity types in scope for v0.3.2; out-of-scope entities stay on map; export and import share one documented contract.

## Type

grilling

## Status

closed

## Claimed by

—

## Blocked by

- [Duplicate resolution](./02-duplicate-resolution.md) (merge needs field lists per entity)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Ampliar todo** — v0.3.2 import/export contract should cover the **inventory surfaces needed for dogfood and pre–Phase 3 migration prep**, not only bare assets:

| Area | In v0.3.2 import (metadata only) |
|------|----------------------------------|
| Projects & environments | Create/link; env names per project |
| Assets | Types, providers, URLs, description, verification status, external ids, attributes where already modeled |
| Project–asset links | Environment on link |
| Emails | Addresses + link to asset (login/other purposes) |
| Identities | Labels + optional login email linkage |
| Dependencies | Directed edges between assets by stable keys (names/slugs in batch) |
| Config entries | Keys/labels; **no secret values** |
| Vault references | Labels/pointers; **no vault payloads** |

**Round-trip:** Hilko export must emit the same shape import accepts (today’s asset-only export is insufficient).

**File packaging** is not decided here — see map *Not yet specified* (multi-sheet vs `assets.csv` + `dependencies.csv`). Recommendation for spec: **multiple CSV files in one upload ZIP** or tabbed template download, to avoid unreadable 40-column sheets.

Still **out:** runbooks, actions, migration plans, integration-sourced rows.
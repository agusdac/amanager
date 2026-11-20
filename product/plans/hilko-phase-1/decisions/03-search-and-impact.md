## Question

F1 search and dependency impact: what implementation bar?

## Done means

OR-1b and OR-1e have concrete limits without opening F2 scope.

## Type

grilling

## Status

closed

## Claimed by

agent (recommended defaults; align spec)

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Search (F1):** server-side pagination; filter by project, provider, status; text search via **SQL `ILIKE`** on name, slug, description, external_identifier (indexes on `workspace_id` + common filters). No Postgres full-text search in F1.

**Impact (F1):** **list view** only (no graph). BFS from entity with **max depth 8**, cycle detection via visited set; each edge shows `relation_type` and verification status. Separate API for identity-centric and asset-centric impact.

## Navigation (F1)

Show only modules with real screens: **Home** (summary counts + pending links), **Projects**, **Accounts & identities** (identities, emails, provider accounts), **Assets** (global inventory), **Onboarding** (wizard entry). Hide Guías, Migraciones, Workspace team, Clients until later phases.
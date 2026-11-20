---
name: domain-model
description: >-
  Hilko domain entities and rules. Use when designing schema, Drizzle tables, APIs,
  queries, or inventory UI (projects, identities, assets, dependencies).
---
# Hilko domain model

Read [docs/HILKO_SPEC_CURSOR.md](../../../docs/HILKO_SPEC_CURSOR.md) §3 and §15 when in doubt.

## Entities are not synonyms

| Entity | Means |
| --- | --- |
| **Workspace** | Isolated tenant (personal or team) |
| **Project** | Product/initiative grouping resources |
| **Provider** | Catalog brand (Google, GitHub, AWS) |
| **Provider account** | Concrete account instance (`Google A`, AWS 123…) |
| **Identity** | Auth principal (login), not just an email |
| **Email address** | Address with purposes: login, recovery, billing, … |
| **Asset** | Real managed resource (repo, VPS, OAuth client, domain) |

## Rules

- Every business row has **`workspace_id`**. No cross-workspace joins or IDOR by guessing UUIDs.
- Same **asset** may link to **multiple projects** (`project_assets`); do not auto-duplicate assets.
- **Identity ≠ email.** One email can relate to many identities with different purposes.
- **Access ≠ ownership.** **Billing ≠ admin.** Model via `asset_roles` + `provider_role_label`.
- Do **not infer** relationships from matching email/domain names; suggest and require confirmation.
- `verification_status`: show `unverified` / `declared` / `confirmed` clearly in UI; never fake "verified".
- `source`: `manual` | `import` | `integration` (integration not in F1).
- Provider granularity: "Cloudflare" alone is insufficient — zone, R2, worker, etc. as separate assets when relevant.

## Dependencies

- Directed edges: `from_asset_id` → `to_asset_id`, `relation_type` from spec §8 (`depends_on`, `hosted_on`, …).
- Impact analysis: BFS with visited set and max depth; label unverified edges.
- Same workspace only.

## Multi-tenant SQL

Prefer composite FKs `(workspace_id, id)` or enforced checks in repositories. Repository layer always filters by active workspace from session, never from client-supplied `workspaceId` alone.
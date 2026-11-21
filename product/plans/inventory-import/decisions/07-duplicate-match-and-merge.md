## Question

How are **duplicates detected**, and what does **merge** change on existing rows?

## Done means

Spec lists match rules per entity type, stable import keys, merge field policy, and preview diff when user chooses merge.

## Type

grilling

## Status

closed

## Claimed by

—

## Blocked by

- [Duplicate resolution](./02-duplicate-resolution.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

### Duplicate detection (assets — primary)

1. If incoming row has non-empty **`external_id`** (or `asset_external_id` column): match existing asset in workspace where `assets.external_identifier` equals that value (case-sensitive trim).
2. Else match on composite **`(project_key, provider_slug, asset_type, asset_name)`** normalized (trim, lower provider slug) within the **import target project scope** (focused project, new project, or row’s `project` column).

Same rules for duplicate **within the batch** (intra-file conflicts flagged before DB match).

Other entities (email address, identity label, dependency edge, config key per asset) get type-specific keys in spec; assets drive the UX.

### Merge semantics

- **Default:** **fill-empty** — import value applies only where the existing field is null, empty string, or absent; never overwrite non-empty DB values automatically.
- **Always overwrite on merge** (explicit allowlist): `description` / `notes`, `admin_url`, `public_url`, `verification_status` (when import value is a valid enum), JSON `attributes_*` keys present in import (per-key fill-empty inside JSON).
- **Never overwrite via merge:** `id`, `workspace_id`, `source`, audit timestamps, `import_batch_id` history on original row; **no** merge into secret-bearing columns (must stay metadata-only).
- Preview shows a **field diff table** when user picks **merge** so they see what will change before commit.

**Skip** and **create duplicate** behave per [02](./02-duplicate-resolution.md); merge uses rules above after user confirms diff.
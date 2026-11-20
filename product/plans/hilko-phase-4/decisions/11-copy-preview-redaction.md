## Question

What exactly does the copy **preview** display, how are sensitive rows flagged, and can the user override blocks?

## Done means

Preview/commit APIs and UI spec list per-category fields, flag rules, checkbox defaults, confirm gates, and scanner behavior without reopening [05](./05-project-copy-preview.md).

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [05-project-copy-preview](./05-project-copy-preview.md)
- [06-permission-matrix](./06-permission-matrix.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

### Flow

1. User (≥ editor on **target** team, copy initiated from **personal** workspace) picks personal project + target team.
2. `POST …/copy/preview` returns categorized selectable rows + summary counts.
3. User toggles inclusion; **Confirm copy** runs second pass validation then transactional copy.

Actor must be **admin or owner** on target to confirm ([06](./06-permission-matrix.md)).

### Categories (tabs or accordions)

| Category | Row grain | Notes |
| --- | --- | --- |
| Project shell | 1 | Name, description, status fields |
| Environments | per env | |
| Assets | per asset linked to project | Includes criticality, URLs, verification, `password_manager_item_url` |
| Project ↔ asset links | per link | environment + purpose |
| Identities | per identity referenced by copied assets/roles | Only transitive closure from selected assets |
| Emails | per email (+ purpose when via asset) | **Full address** shown — intentional PII surface |
| Dependencies | per edge | Omitted if either endpoint asset excluded |
| Config entries | per entry | key, description, `value_type`, `public_value` when present |
| Vault references | per ref | label, provider, `location_hint`, `item_url`, notes |
| Asset roles | per role | |
| Verifications | per record | evidence notes shown; scanned |
| Runbooks | per runbook | Steps bundled with parent unless whole runbook excluded |

Closure recompute when user toggles assets: dependencies and identities refresh server-side (or client refetch preview).

### Preview display (no fake redaction)

Preview shows **stored metadata only** ([no-secrets](../../../.cursor/skills/no-secrets/SKILL.md)): emails and vault hints are visible so the user can decide. There is **no** masked email display in v0.4.0.

### Sensitivity flags (not exclusions)

Rows get `sensitivity: "flagged"` when any of:

- category is vault reference or email
- `config_entries.is_sensitive_reference = true`
- asset has `password_manager_item_url`
- config key matches secret-name patterns (same list as CSV import)

Flagged rows are **included by default** (checked). On commit, if any **checked flagged** row remains, require **extra confirm** step (checkbox + short copy EN/ES: "These items expose contact or vault metadata to the team workspace").

### Secret scanner (hard block)

Run the same helpers as import (`server/utils/secret-scan.ts`) over text fields in the preview payload (`notes`, `description`, `public_value`, `evidence_note`, `body_markdown`, etc.).

- **`blocked` rows:** cannot be checked for copy; show scanner reason; **no override** — user must fix in personal workspace and regenerate preview.
- Commit endpoint re-scans; reject with **400** if a blocked row id is submitted.

### User override scope

- **May exclude** any non-blocked row (uncheck).
- **May not** force-include blocked rows.
- **May not** partially copy a runbook (exclude individual steps in v0.4.0).

### Copy semantics

- New UUIDs in target workspace; remap FKs inside the bundle.
- Assignees ([10](./10-assignees.md)): cleared on copy (no cross-workspace user FK).
- `created_by_user_id` on new project → copying user.
- Record audit event `project.copy` with safe summary (counts, source/target ids) on **target** workspace.

### UI

- Summary header: total / flagged / blocked counts.
- Blocked category pinned or filter "Needs fix".
- Link from blocked row → edit in personal workspace (new tab).

## Related

- [Permission matrix](./06-permission-matrix.md) — who may preview vs confirm.
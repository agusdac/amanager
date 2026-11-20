# Runbook audit events (F2 minimal)

## Question

Which runbook / execution / export mutations write to `audit_events` in v0.3.0, and how much detail is safe in `safe_diff_jsonb`?

## Done means

Build can call `recordAudit` on the agreed API paths with stable `entity_type` / `action` names and metadata-only payloads; step-level execution noise is explicitly out.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- none

## Forge

- TBD

## Answer

Extend F1 **minimal audit** (still **no audit UI** in v0.3.0). Same helper: `server/utils/audit.ts` → `recordAudit`.

### Audited (yes)

| `entityType` | `action` | When | `safeDiff` (examples) |
|--------------|----------|------|------------------------|
| `runbook` | `create` | From template | `projectId`, `templateSlug`, `title`, `stepCount` |
| `runbook` | `update` | PATCH runbook / step CRUD / manual reorder | `fields`: `title`, `status`, `stepCount`; optional `refreshFromInventory: true` — **no** full Markdown bodies |
| `runbook` | `delete` | Archive/delete runbook | `title`, `projectId` |
| `runbook` | `export` | Markdown download | `locale`, `source`: `runbook` \| `execution`, `executionId` if applicable |
| `runbook_execution` | `start` | POST execution | `runbookId`, `contentBinding`, `projectId` |
| `runbook_execution` | `complete` | Terminal status | `status`, `stepCounts`: `{ done, skipped, failed, … }` |
| `runbook_execution` | `cancel` | User/system cancel | `status` |

### Not audited (v0.3.0)

- **Per-step PATCH** during execution (`runbook_step_results` updates) — history lives on execution + step results; auditing each mark would be noisy.
- Template catalog changes (seeded system templates, not user-edited in MVP).
- Read-only GETs.

### Safety

- **Never** store: step `body_markdown`, export file content, `result_note`, vault paths, URLs with tokens, env var values.
- Titles in diffs are OK when short and metadata-like; prefer ids + counts when in doubt.
- Align with F1: [04-audit-events.md](../hilko-phase-1/decisions/04-audit-events.md).

### Deferred (F2+)

- Audit log viewer UI
- Retention / export of audit stream
- Optional audit on high-risk step types only (`approval`, `high` risk) if compliance asks later
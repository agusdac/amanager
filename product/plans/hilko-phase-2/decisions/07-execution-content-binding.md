# Execution content binding (snapshot vs live)

## Question

When someone starts a **runbook execution**, should step content be **frozen** (spec: congelar al crear ejecución) or **live** against later runbook edits — or both?

## Done means

Create-execution flow, schema, and export rules agree on default binding and how live mode behaves when steps change mid-run.

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

**Both modes in v0.3.0; default = snapshot (frozen).**

### At start (`POST …/executions`)

- Field **`contentBinding`**: `snapshot` | `live`. **Default `snapshot`** (matches §21 generator rule + schema note on frozen executions).
- UI: primary action starts frozen; secondary control (link or “Advanced”) allows **“Follow live runbook”** with short copy: edits to the runbook will change what you see in this execution; completed notes stay on each step.
- **No binding change** after execution has started.

### `snapshot` (recommended default)

- On start, **copy** all steps into execution-owned rows (e.g. `runbook_execution_steps`: `step_key`, order, DAG, title, `body_markdown`, kind, risk, link refs).
- `runbook_step_results` reference **snapshot step ids**, not live `runbook_steps`.
- Runbook/template edits **do not** alter this execution’s instructions or export from execution history.
- Aligns with audit-friendly history and spec “instantánea” semantics.

### `live` (opt-in)

- `runbook_step_results` reference **current** `runbook_steps.id`.
- Step instructions/DAG read from the **live runbook** at render time.
- **Edits while in progress:**
  - Body/title/order changes → execution UI shows **current** content; soft callout if `updated_at` of step &gt; `execution.started_at` (“Updated since you started”).
  - Step **removed** → existing result row stays; show **orphaned** state (step removed from runbook); cannot mark new work on that step.
  - **New** steps added after start → visible as **not part of this run** (optional “Add to this execution” out of scope for v0.3.0).
- Completed `result_note` / status **never** overwritten by runbook edits.

### Export

- **From runbook (no execution):** current runbook content (existing decision).
- **From execution detail:**
  - `snapshot` → export uses **execution snapshot** + results.
  - `live` → export **materializes at export time**: current runbook bodies for bound steps + stored results; header metadata includes `contentBinding: live` and `exportedAt` (not a retroactive freeze).

### Out of scope v0.3.0

- Per-workspace default preference (always live).
- Mid-execution switch snapshot ↔ live.
- Versioned runbook rows separate from “live” editing (full immutable versioning is F2+ if needed).
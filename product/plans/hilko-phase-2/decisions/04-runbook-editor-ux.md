# Runbook editor UX (MVP)

## Question

For v0.3.0, is the runbook body **template-driven only** (fixed steps + per-step notes field), or do we allow editing step Markdown in-app per spec’s “simpler template + own notes” line?

## Done means

UI/API contract chosen: what users can customize after generation without breaking DAG or export safety.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Template → workspace copy → full Markdown editing.**

1. **Create:** User picks a system template + inputs → Hilko generates a **runbook instance** (copy). Original template stays read-only system seed.
2. **Edit scope (MVP):**
   - **Per step:** title + `body_markdown` editable (textarea / simple Markdown preview).
   - **Whole runbook:** optional **“overview”** Markdown block at runbook level (intro, links, warnings) edited in full.
   - User may add **manual steps** (append) and soft-delete/hide template steps; DAG edges user-defined only for new steps — template `depends_on` preserved unless user explicitly changes step keys (advanced).
3. **Refresh from inventory:** Optional action **re-merges auto-generated sections** into a runbook. Must **not** overwrite user-edited Markdown without confirm (diff preview: “accept auto block updates / keep mine”).
4. **Export:** Exports current Markdown (generated blocks + user edits). Still **no secrets** scanner on save/export (reuse `no-secrets` patterns).
5. **Not MVP:** WYSIWYG, collaborative real-time edit, version diff UI (beyond execution freeze — see spec).

Template is the starting point; after copy the runbook is **the user’s document**, editable end-to-end.
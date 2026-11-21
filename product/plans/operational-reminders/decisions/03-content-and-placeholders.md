## Question

What is the **content model** for a reminder?

Dimensions: Markdown body only vs structured blocks (title + command block + checklist lines); allowed **placeholders** (`{ipv4}`, `{hostname}`, `{identityLabel}`) resolved from linked asset at display time; copy-to-clipboard for command lines; secret-pattern lint on save.

## Done means

We agree v1 fields, max lengths, validation rules (no-secrets), and one example each for VPS SSH, Docker login, and YouTube pre-publish checklist.

## Type

grilling

## Status

closed

## Claimed by

none

## Blocked by

- [01 — entity vs runbook](./01-entity-vs-runbook.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**v1 content (all in v1, still simple UI):**

- Fields: `title` (required), `body_markdown` (required), anchor FKs, optional `pinned` boolean.
- **No template syntax** exposed (`{ipv4}`) in v1 — users write plain markdown; less cognitive load.
- On **asset** notes only: action **“Insertar del activo”** inserts literal lines at cursor (admin URL, IPv4/hostname from `attributes_json`, resource name) — one tap, no placeholder engine.
- **Code blocks:** render + **Copiar** per block in read view.
- **Checklists:** markdown `- [ ]` only; no persisted ticks in v1.
- **Save:** run secret-pattern scan; reject obvious secrets with i18n error (same spirit as no-secrets skill).

Examples locked for dogfood: VPS SSH block, Docker follow-up lines, YouTube pre-publish checklist, email reply bullets.
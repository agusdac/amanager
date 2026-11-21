## Question

How do **Notion, Confluence, Google Sheets / Excel**, and similar tools relate to import in v0.3.2?

## Done means

Brief promises what users can do without implying live integrations; map lists API connectors as out of scope; UX includes documented mapping paths.

## Type

grilling

## Status

closed

## Claimed by

—

## Blocked by

- [File format package](./05-file-format-package.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**v0.3.2 = file-based, not connector-based.** Users bring **exports or CSV downloads**; Hilko does not call Notion/Confluence/Sheets APIs in this release.

| Source | Typical handoff into Hilko |
|--------|-------------------------|
| **Google Sheets / Excel / Numbers** | File → CSV (or export one sheet); upload single `assets.csv` or full ZIP. |
| **Notion** | Full-page database → `⋯ → Export → Markdown & CSV` → ZIP with one **flat CSV per database** (current view columns only). User builds a dedicated **“→ Hilko” view**; optional column mapper in preview maps headers → contract. |
| **Confluence** | No native single-table CSV: copy/paste to Sheets, or marketplace **Export to CSV**, or page export detours. Same upload path. |
| **Airtable / otros** | CSV export → same path. |

**In-product (v0.3.2):**

1. Import wizard step **“¿De dónde vienen los datos?”** with cards (Hilko export, Hoja de cálculo, Notion, Confluence, Otro) linking to short **mapping recipes** (i18n EN/ES, no secrets).
2. Preview supports **header mapping** (source column → Hilko column) saved for the session; optional named preset per workspace later.
3. Secret scan and duplicate resolution unchanged.

**Out of scope v0.3.2 (map / Phase 3+ research):**

- OAuth to Notion / Atlassian / Google Drive
- Scheduled sync or “live” inventory from external DBs
- Scraping Notion relation URLs into auto-deps without user review

**Research artifact:** [External sheet sources](../assets/05-external-sheet-sources-research.md).
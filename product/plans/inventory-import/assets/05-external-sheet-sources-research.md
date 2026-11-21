# Research — Notion, Confluence, spreadsheets → Hilko import

**Parent:** [File format](../decisions/05-file-format-package.md) · [External sources](../decisions/06-external-sheet-sources.md)  
**Date:** 2025-11-21 (conversation)

## Takeaway

All these tools converge on **a flat CSV (or paste into a sheet then CSV)**. Hilko should optimize for **one-table bootstrap** + **full ZIP** for round-trip, and **header mapping in preview** — not vendor APIs in v0.3.2.

## Notion

- Full-page **databases** export via `⋯ → Export → Markdown & CSV` → **ZIP** containing CSV(s). Inline DBs must be opened full-page first. [Notion Help — Export](https://www.notion.com/help/export-your-content)
- Only **one view’s** columns export (current or default); filters/sorts/colors are lost. User should create a view whose columns mirror Hilko (or map in preview).
- Relations export as **plain text / URLs**, not Hilko-ready edges — dependencies usually need a second pass or manual `dependencies.csv`.
- Select/multi-select → labels; formulas/rollups → frozen values at export time.

**Recipe for operators:** Notion “Inventario Hilko” view → export CSV → rename to `assets.csv` or map columns → upload.

## Confluence

- **No** built-in export for a single table to CSV on all tiers; common paths:
  - Select table → copy → paste into Google Sheets → Download CSV
  - Marketplace macros (Table Filter, Export Tables, etc.) → CSV
  - Page export to Word → copy table (merged-cell pain)
- Merged cells break naive paste; users should unmerge or use export apps. [Stiltsoft summary](https://stiltsoft.com/blog/how-to-export-confluence-table-to-excel/)

**Recipe:** one table per page when possible; export CSV; map columns in Hilko preview.

## Google Sheets / Excel / “tablas varias”

- Canonical: **one sheet → one CSV** per entity type, or multiple tabs exported separately then zipped into Hilko bundle.
- EU locales: semicolon-separated CSV — manifest should allow delimiter hint or auto-detect in parser.

## Product implications (for spec)

1. **Simple upload** accepts messy headers → mapping UI → preview to contract columns.
2. Docs/templates include a **Notion view checklist** (column names) and **Confluence pitfalls** (merged cells).
3. **dependencies.csv** is not auto-generated from Notion relations in v0.3.2; optional future research ticket.

## Sources

- Notion Help — export formats and CSV scope  
- Community guides on Notion CSV limitations (relations, views)  
- Confluence ecosystem docs on copy-paste vs marketplace CSV export  
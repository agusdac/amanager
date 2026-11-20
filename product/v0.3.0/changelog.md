# Changelog — v0.3.0 (unreleased)

## Added

- [hilko-phase-2](../features/hilko-phase-2.md): Runbook templates, inventory-backed generator, Markdown editor, manual execution with snapshot/live binding, and README export (EN/ES).
- Appearance preference (light/dark) on user account with cookie sync and no-flash init.
- Themed checkboxes, asset-type badges (vector icon for repository), and dark-mode graph palette.

## Fixed

- Production build: theme constants live under `app/constants/theme.ts` (no broken `shared/schemas/theme` in Nitro bundle).
- Dark contrast across guides (refresh diff, templates workspace), import preview, and shared semantic text utilities.

## QA

See [docs/F2_SMOKE.md](../../docs/F2_SMOKE.md) before release tag.
# Fase 2 smoke — Runbooks (v0.3.0)

Manual pass before tagging **v0.3.0**. Use Northline seed or a real project with assets + envs.

## Preconditions

- `bun run db:migrate`
- Signed-in user, at least one project with linked assets
- EN and ES locale tested once

## Flow

1. **Templates** — `/guides/templates`: three system templates visible; workspace template badge readable in dark mode.
2. **Create runbook** — `/guides/new`: pick `new-developer-onboarding` + project (+ env if required); generator runs without secrets in steps.
3. **Edit** — runbook detail: overview Markdown save; step edit; preview renders in dark/light.
4. **Refresh inventory** — refresh diff panel (amber `notice-wash`) readable; merge checkboxes work.
5. **Execution** — start with default **snapshot**; optional **live** toggle; step status buttons visible in dark mode.
6. **Export** — download `.md` in current locale; scan for passwords, tokens, or invented OAuth values (must be none).
7. **Checklist q9** — `/checklist` or dogfood doc: confirm README/onboarding answer is traceable from exported runbook.

## UI polish included in this release

- Account appearance (light/dark) instant save + feedback
- Guides/templates/import dark contrast
- Dependency graph theme-aware canvas
- Custom checkboxes and asset type badges (incl. repository vector icon)

## Automated

```bash
bun run test
bun run build
```
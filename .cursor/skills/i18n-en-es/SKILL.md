---
name: i18n-en-es
description: >-
  Hilko UI i18n (English default + Spanish). Use when adding pages, components,
  validation messages, emails, or any user-visible string in the Nuxt app.
---
# i18n: English + Spanish, no URL prefix

## Config (locked)

- Package: `@nuxtjs/i18n`
- Locales: `en` (default), `es`
- **`strategy: 'no_prefix'`** — never use `prefix`, `prefix_except_default`, or `prefix_and_default`
- Routes stay identical: `/projects`, not `/es/projects`
- Locale: **cookie** (later also user preference in DB)
- First visit without cookie: optional `Accept-Language` detect, fallback `en`

## Authoring rules

1. No hardcoded user-facing strings in `.vue` files — use `$t()` / `useI18n()`.
2. Keys: nested by feature (`projects.title`, `assets.impact.empty`).
3. Keep **English** `en.json` as source of truth; mirror in `es.json`.
4. Pluralization and interpolations in locale files, not concatenation in components.
5. Server error messages: return a **code** from API; map to i18n on client (or use locale-aware server helper).

## Language switcher

- UI control sets cookie + `setLocale()`; do not navigate to a different path.
- Persist choice when user settings exist (post-F0).

## Exports (F2+)

Runbook/migration Markdown exports use **active locale**, fallback `en` (spec §9).
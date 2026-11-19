## Question

How should English/Spanish i18n work in URLs?

## Done means

`@nuxtjs/i18n` strategy is `no_prefix`; default locale `en`; documented in spec and `i18n-en-es` skill.

## Type

grilling

## Status

closed

## Claimed by

user

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

Locales `en` (default) and `es`. **`strategy: 'no_prefix'`** — never `/es/...` in paths. Language in cookie; `Accept-Language` only on first visit without cookie.
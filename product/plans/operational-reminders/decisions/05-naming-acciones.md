## Question

What do we call the new note entity in product UI and code?

## Done means

User-facing name (en/es), API/DB working name, and nav/tab labels are fixed and consistent.

## Type

grilling

## Status

closed

## Claimed by

none

## Blocked by

none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

| Layer | Choice |
|-------|--------|
| **User-facing (es)** | **Acciones** — “cómo hacer algo otra vez”, no runbook |
| **User-facing (en)** | **Actions** |
| **DB / API** | `actions` table (`action_id`), replaces working name `operational_notes` |
| **Feature slug** | `actions` (plan folder may stay `operational-reminders` for history) |
| **Tab on asset/project** | `Acciones` / `Actions` (not Recordatorios) |

Runbooks stay **Guías**; no naming collision.
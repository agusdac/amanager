# Guides navigation & entry points

## Question

Where do runbooks live in the shell: top-level **Guides**, under **Projects** (per project tab), both, or Accounts-adjacent — and is export only from runbook detail?

## Done means

Primary nav + deep links (from project, from checklist q9, from asset) are agreed for F2 UI.

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

**Three surfaces + deep links.**

| Surface | Role |
|---------|------|
| **Home** | Card **Setup guides**: count of runbooks, resume in-progress execution, CTA “New from template” → `/guides/new` (template picker). |
| **Primary nav** | **Guides** (`/guides`) — workspace list: filters by project, template slug, status; same create entry. |
| **Project** | Tab **Runbooks** — runbooks scoped to `projectId`; create pre-fills project (and default env when known). |

**Deep links (v0.3.0):**

- Checklist q9 → create/open `new-developer-onboarding` for Northline (or last used project).
- Export / download **`.md`**: only from runbook detail (and success toast with filename).

**Not v0.3.0:** per-asset “mentioned in guides” panel (defer v0.3.1).

**i18n keys:** `nav.guides`, `home.guidesCard`, `tabs.projects.runbooks`.
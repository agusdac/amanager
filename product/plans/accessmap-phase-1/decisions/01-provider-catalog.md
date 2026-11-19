## Question

How do provider brands (Google, GitHub, …) appear in F1?

## Done means

F1 spec and schema state whether providers are global, seeded, and how assets reference them.

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

**Global system catalog** in `providers` with `is_system = true`, seeded via migration/seed script (slug, name, category, website). All workspaces **read** the same catalog. Assets may set `provider_id` to a system row or leave it null for generic/unknown (“Otro”). Workspaces do **not** duplicate catalog rows. Custom provider names for odd tools use `provider_id` null + descriptive `asset.type`/`notes`, not new global slugs without admin seed update.
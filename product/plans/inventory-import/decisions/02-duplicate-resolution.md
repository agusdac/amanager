## Question

When import would create something that **already exists**, what should the product do?

## Done means

Preview shows duplicate warnings with enough context to choose; commit applies only after resolutions; behavior is testable and documented in spec Behaviors.

## Type

grilling

## Status

closed

## Claimed by

—

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Always surface duplicates in preview** (do not silently insert). For each detected match, the user must choose one of:

| Choice | Effect |
|--------|--------|
| **Skip** | Do not apply this row (or this entity slice). |
| **Merge** | Update the existing record with incoming non-secret fields per merge rules in spec (exact field policy still open in map *Not yet specified*). |
| **Create duplicate** | Insert a second record intentionally (user accepts “double” in inventory). |

Default UI stance: no batch-level “apply same to all” required in v1, but bulk shortcuts are optional nice-to-have in build tickets. Commit is blocked until every flagged duplicate has a resolution (or row is removed).
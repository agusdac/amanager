## Question

How are `owner|admin|editor|viewer` enforced in slice 1?

## Done means

We have a testable permission matrix at API level and know whether fine-grained exceptions need a separate decision ticket.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [02-mvp-first-slice](./02-mvp-first-slice.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Option C — baseline + fine rules.**

Baseline:

- **viewer:** read-only (`GET` / exports where explicitly allowed).
- **editor:** create/update inventory and runbooks; no membership or invite management.
- **admin:** editor + invites + member role changes; no workspace delete unless also owner (TBD in matrix ticket).
- **owner:** full workspace control.

**Fine-grained exceptions** are locked in [06-permission-matrix](./06-permission-matrix.md) (viewer runbook MD + assets CSV; editor deletes **only own** projects via `created_by_user_id`; invites admin+owner only). Spec §22 “usuario de solo lectura no modifica rol” must pass in API tests.
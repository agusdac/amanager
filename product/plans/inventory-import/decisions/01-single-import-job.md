## Question

What is the **one primary job** of CSV/file import before Phase 3?

## Done means

We can state in the brief a single user-facing promise (one nav entry, one wizard) without splitting “bootstrap” vs “maintenance” into different formats or pages.

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

**One job:** *Bring inventory into Hilko and keep it in sync in bulk* — covers (1) first load from an external spreadsheet/wiki and (2) **export → edit → re-import** round-trip, using the **same file contract** and the same preview/commit/revert flow. No separate “migration CSV” vs “update CSV”; row-level duplicate handling distinguishes create vs update intent.
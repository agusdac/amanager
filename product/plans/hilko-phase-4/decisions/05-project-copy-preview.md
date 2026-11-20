## Question

What does the personal → team project copy preview show and allow before commit (slice 2)?

## Done means

We can design the preview UI and API without guessing what is copied, omitted, or user-selected.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [01-workspace-collaboration-model](./01-workspace-collaboration-model.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Option B.**

Preview lists inventory **by category** (assets, emails, vault references, identities, dependencies/runbooks as included bundles). User can **exclude rows** before copy. Copy creates new rows in **target team workspace** (no cross-workspace FKs). Nothing is shared automatically from personal without explicit confirm.

Field-level flags, scanner blocks, and confirm gates: [11-copy-preview-redaction](./11-copy-preview-redaction.md).
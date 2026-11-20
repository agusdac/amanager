# Generator behavior when inventory is incomplete

## Question

When generating steps, if a linked asset, vault ref, or config entry is missing or `unverified`, should the generator omit the step, include a **“pending — complete in inventory”** block, or block export until resolved?

## Done means

One rule set applies consistently in generator + export (spec: do not invent OAuth URIs; show pending when resource missing).

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Include the step; never invent metadata.**

- If a template step requires a resource link (asset, identity, vault ref, config entry key, environment) and it is **missing**: render step body with a **Pending in inventory** callout — what to create/confirm + deep link (`/assets/:id`, project map, etc.).
- If linked but **`unverified` or `declared`**: same step, optional softer hint to confirm control (verification guide); still exportable.
- **Export always allowed** in v0.3.0 (no strict gate). The Markdown header states counts of pending/blocked steps.
- **Execution:** step may start as `blocked` when prerequisites are missing; user can mark `skipped` with note or complete inventory and regenerate/refresh runbook (regen policy TBD in build — prefer “refresh from inventory” action without losing manual notes).
- **Never:** interpolate guessed OAuth redirect URIs, hostnames, or secret-like strings from partial data (`no-secrets`).

No “strict export” mode in F2 MVP.
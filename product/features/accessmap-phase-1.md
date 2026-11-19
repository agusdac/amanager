# accessmap-phase-1 — Inventory (dogfood)

## Version

**v0.2.0** (unreleased) — first value milestone; completes personal inventory before runbooks.

## Plan

- [Map](../plans/accessmap-phase-1/map.md)
- [Slim spec](../specs/accessmap-phase-1.md)
- [Phase 0 prerequisite](../features/accessmap-phase-0.md)

## Description

Expand the foundation into a structured map of projects, identities, emails, provider accounts, assets, roles, dependencies, and verification state—without storing credentials. Onboarding wizard and CSV accelerate first setup; Mini Críptico seed supports dogfood.

## Value

Validates the core product hypothesis: a single place to see **what account controls what** and **what breaks if something changes**.

## Primary user stories

1. I complete the 5-step wizard or CSV and have ≥5 assets with declared identities.
2. I distinguish Google A vs Google B and four emails with different purposes.
3. I link dependencies and run an **impact list** before changing VPS or an identity.
4. I import assets via CSV preview without secrets being stored.
5. I search/filter a growing inventory with server pagination.

## Requirements

- Full F1 schema per spec §15 (minus `clients` UI)
- System provider seed catalog
- CRUD + list/detail UIs for inventory entities
- `verification_status` visible; never fake verified
- Wizard with “not sure yet” and DB draft resume
- CSV import preview/commit + export (no-secrets scan)
- Seed: fictional Mini Críptico with `unverified` markers
- Multi-tenant tests extended for new APIs

## Constraints

- `workspace_id` on all mutations; no cross-tenant IDs
- Metadata only (`no-secrets` skill)
- i18n EN default, ES, no URL prefix

## Dependencies

- accessmap-phase-0 (auth, workspace, minimal project/asset)
- Closed decisions in `product/plans/accessmap-phase-1/decisions/`
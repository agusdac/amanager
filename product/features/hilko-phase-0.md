# hilko-phase-0 — Foundation

## Version

**v0.1.0** (unreleased) — first deployable vertical slice before inventory dogfood.

## Plan

- [Map](../plans/hilko-phase-0/map.md)
- [Slim spec](../specs/hilko-phase-0.md)

## Description

Hilko (provisional name) gets a secure multi-tenant base: one user can sign up (first install only), receive a personal workspace, and create projects and assets stored in PostgreSQL.

## Value

Proves workspace isolation, session auth, and real persistence before the larger F1 inventory model.

## Primary user stories

1. As the first user on an instance, I register and land in my personal workspace.
2. I create a project and at least one asset with admin URL metadata (no secrets).
3. Another workspace’s data is inaccessible via API.

## Requirements

- Docker dev stack (Postgres + Mailpit) and prod compose scaffold
- Custom session auth with closed signup after first user
- i18n EN default + ES, no URL locale prefix
- CRUD API for project + minimal asset
- Integration test for tenant isolation

## Constraints

- Metadata only; follow `no-secrets` skill
- Every query scoped by `workspace_id` from session membership

## Dependencies

- Decisions in `product/plans/hilko-phase-0/decisions/` (closed)
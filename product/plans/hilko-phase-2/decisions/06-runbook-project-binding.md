# Runbook project binding & executions

## Question

Are runbooks / executions **project-bound only**, or can v0.3.0 create workspace-global runbooks without a project?

## Done means

Schema and create flows agree: when `projectId` is required, generator inputs and nav match.

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

**`projectId` required** when creating a runbook from any system template in v0.3.0.

- Runbook row: `workspace_id` + **`project_id` NOT NULL** + optional `environment_id` (required for templates that declare `environmentId` input — onboarding + staging bootstrap).
- **Execution** always references one runbook; history is per runbook (multiple executions allowed; one “active” optional UX convenience).
- Home / Guides list: all workspace runbooks with **filter by project** (default: all).
- No workspace-only runbooks in v0.3.0 (defer if needed for org-wide policies in F4+).
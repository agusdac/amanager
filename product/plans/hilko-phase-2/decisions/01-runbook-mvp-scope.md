# MVP scope = full §21 slice

## Question

What is the minimum shippable runbook product for **v0.3.0** (Fase 2)?

## Done means

We have a written scope that lists in-scope capabilities (templates, generation, execution, export) and explicit deferrals, so build tickets do not reopen this question.

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

Ship **full spec §21 MVP** in one milestone:

- **In:** `runbook_templates` (≥3 seeded), workspace runbooks from template + project/environment, step DAG with manual execution states, execution history, Markdown export in active locale (fallback `en`), generator from inventory links (names, URLs, vault ref labels, config entry keys — never secret values).
- **Out:** V1 repo file import, automatic command execution, DNS/deploy side effects, migration plans (F3), audit log UI.

Dogfood success: generate and export a credible **developer onboarding** README for Northline using only Hilko metadata.
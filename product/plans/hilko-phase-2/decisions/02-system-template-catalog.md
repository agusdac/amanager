# System template catalog (≥3)

## Question

Which **three** system `runbook_template` slugs ship in v0.3.0, and what is each one’s primary audience?

## Done means

A fixed list of slug + title (EN/ES keys) + required inputs (`projectId`, `environmentId`, etc.) is agreed and maps to spec §21 examples (e.g. new developer onboarding).

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

Ship exactly **three** system templates (seeded globally, versioned; instances are workspace-scoped runbooks):

| Slug | Title (EN key stem) | Audience | Required inputs |
|------|---------------------|----------|-----------------|
| `new-developer-onboarding` | Onboard a new developer | Tech lead / founder handing repo + tooling access | `projectId`, `environmentId` |
| `staging-environment-bootstrap` | Bootstrap staging / dev environment | Person standing up or rebuilding a non-prod env | `projectId`, `environmentId` |
| `access-handover-checklist` | Access handover (person or role change) | Owner documenting who takes over accounts, emails, roles | `projectId` (optional `identityId` focus in UI) |

**i18n:** `runbooks.templates.<slug>.title` + description in `en`/`es`.

**Dogfood:** `new-developer-onboarding` + Northline satisfies checklist §4.4 q9 when execution + export exist.

**Not in v0.3.0 seed:** repo-specific command steps, mailbox disaster recovery, OAuth rotation (candidatos F2.1 o plantillas workspace-custom post-MVP).
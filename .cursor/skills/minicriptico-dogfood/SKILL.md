---
name: minicriptico-dogfood
description: >-
  Northline demo seed and Phase 1 acceptance criteria. Use when writing db seed,
  E2E scenarios, or verifying inventory dogfood against spec section 4.
---
# Northline demo dogfood (Phase 1)

Reference: [docs/HILKO_SPEC_CURSOR.md](../../../docs/HILKO_SPEC_CURSOR.md) §4, §4.4, §26.A.

## Seed principles

- Workspace personal; project **Northline** (`northline-demo`), site `northline.example`.
- Environments: `production`, `development` (no assumed `staging`).
- **Four mailbox labels** (Team inbox, Billing notices, Support, Personal backup) — `@example.invalid` addresses only.
- **Two distinct Google identities** (Workspace admin vs Cloud billing) — not merged because same provider.
- Assets to include (all `verification_status` unverified/declared unless user confirms):
  - Google OAuth client, YouTube, Ads, Search Console
  - GitHub: 2 repo placeholders
  - 2× VPS, Namecheap domain, OpenShip mail, Cloudflare storage, AWS SES
  - Bitwarden: **vault references only**, zero secrets
- **≥10 dependency/role relationships** for user confirmation in UI.

Never put real credentials, real personal emails, or production tokens in seed files.

## Questions seed + UI must support (§4.4)

After Fase 1, a user with this inventory should be able to answer manually from the app:

1. Which services use Workspace admin vs Cloud billing?
2. Impact of losing Team inbox (recovery/login paths).
3. Where OAuth is configured (linked assets, env, config entry **names** only).
4. YouTube channel ownership/roles (declared, not verified with Google API).
5. Search Console property and verification method (metadata).
6. Dependencies: registrar vs DNS vs mailbox vs SES.
7. VPS mapping: what runs where, deploy from which repo, SSH ref in vault.
8. Image storage consumer and config.
9. Onboarding another dev **without** sharing passwords (roles + vault refs + runbooks pending F2).
10. What would change before GitHub→Bitbucket or registrar migration (impact list; plans in F3).

## Acceptance checks

- [ ] Both Google identities show separate in Emails & access views.
- [ ] Same AWS SES asset linked to project without duplicate row.
- [ ] Impact query on VPS-01 and on Workspace admin returns list with relation types.
- [ ] CSV round-trip does not introduce secrets.
- [ ] Wizard can complete with "not sure yet" on accounts.
- [ ] Second workspace cannot read Northline data via API.

## Reseed

`bun run db:seed --workspace=<uuid>` replaces demo data in that workspace only.

## Out of scope for Phase 1 dogfood

- Generated README (Fase 2)
- Migration plan exports (Fase 3)
- Live verification via Google/GitHub APIs
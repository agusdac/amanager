# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The first user is a solo maintainer: one person who returns to a project months later and needs to see what exists, which account controls it, and what would break.

The product succeeds when a freelancer with several client projects, or a small team, can use that same map and keep one client's work from mixing with another's.

Digital agencies are a later market. The workspace model is ready for them. They are not the audience of the current product.

Mini Críptico is a realistic example of the job. It is not the acceptance test.

## Product Purpose

AccessMap is a map of the digital infrastructure a person or team already runs: what exists, where each thing is administered, which identity or account controls it, how resources depend on each other, and where a secret lives by reference to an external vault.

It exists because those relationships are scattered across providers. Success means a freelancer or a small team can trust the map with no credentials stored in it. Setup guides and migration plans are part of that success and are not built yet. A person carries out any change. The product does not perform it.

## Positioning

The mechanism is one structured map that joins inventory, identities, and dependencies, and later adds setup guides and change plans, while secrets stay in an external vault.

A password manager, a wiki, a CMDB, or the provider consoles themselves do not hold that combination. The claim a neighbor cannot truthfully copy: the infrastructure is explained, connected, and ready to rebuild or hand over, and the product stores no passwords.

## Operating Context

People arrive with accounts and resources already spread across email, Google, registrars, DNS, hosting, repositories, content tools, and transactional email. They register projects, identities, email addresses, provider accounts, assets, roles, configuration metadata, vault references, and dependencies.

They start from an onboarding wizard or a CSV file, then search the inventory and read an impact list before a change. English is the default language. Spanish is available. The locale is stored in a cookie, and URLs do not change with language.

The first registration creates the owner and a Personal workspace. Further signups stay closed unless signup is explicitly opened. The workspace is the isolation boundary from the first day, whether it is personal now or shared later.

## Capabilities and Constraints

Working name in the interface: AccessMap. That name is provisional and is not a brand commitment. The repository name is `amanager`.

Shipped foundation and inventory:

- Custom sessions. The first user is the owner. Signup closes after that user exists.
- A personal workspace, projects, and environments.
- Providers, provider accounts, identities, email addresses, assets, roles, configuration entries, vault references, verifications, and dependencies.
- An impact list over documented dependencies.
- A five-step onboarding wizard with resumable drafts and an explicit "not sure yet".
- CSV import with preview and commit, CSV export, and rejection of columns that look like secrets.
- Search and filters with server-side pagination.
- English and Spanish, with no locale prefix in the URL.

Part of the product, not built yet:

- Runbooks and a generated setup guide.
- Migration plans a person executes, with preflight and rollback. The product does not apply them.
- Team invitations and roles.
- An agency client interface.
- A visual dependency graph.
- Live integrations that verify provider state.

Durable constraints:

- Metadata only. Passwords, tokens, 2FA codes, private keys, session cookies, and real environment files stay out. A vault reference points at an item in Bitwarden, 1Password, or another external vault.
- A declared fact is not a verified fact. A saved form is not a check against the provider. Do not treat a shared email, a shared domain, or a similar name as a relationship. Suggest it and ask.
- Production changes stay outside the product. DNS, permissions, billing, and deploys are recorded as plans a person carries out.
- An asset can belong to more than one project. Access, ownership, and billing are different facts.
- Terms that stay distinct: workspace, client, project, provider, provider account, identity, email address, asset, environment, configuration entry, role, dependency, vault reference, runbook, migration plan, verification.

## Evidence on Hand

- Working product spec: `docs/ACCESSMAP_SPEC_CURSOR.md` (version 0.2, 2026-11-19).
- Roadmap: `docs/ROADMAP.md`.
- Shipped scope notes: `product/v0.1.0/` and `product/v0.2.0/`.
- Interface copy: `i18n/locales/en.json` and `i18n/locales/es.json`. The app name string is AccessMap. The English tagline is "Your digital infrastructure map".
- Mini Críptico is an example. The repository seed is fictional and marked unverified. It is not a verified inventory and not customer proof.

No logo, testimonials, case studies, press, pricing, or licensing claims exist. Future work must not invent them.

## Product Principles

1. One person can open a project and see what exists, which identity controls it, and what depends on it.
2. Secrets stay in an external vault. The map stores metadata and references.
3. A declared fact stays distinct from a verified fact. The product never presents an assumption as a check.
4. The first user is a solo maintainer. The product earns its place when a freelancer or a small team can keep client work separate. Agencies come later, on the same workspace model.
5. Guides and migration plans tell a person what to do. The product does not perform the change.

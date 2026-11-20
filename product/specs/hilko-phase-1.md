# Phase 1 — Inventory (dogfood)

## Version & scope

**v0.2.0** · Exit: spec **§26.A**, **§4.4** · ROADMAP Fase 1.

## Decisions locked

| Decision | Gist |
| -------- | ---- |
| [01 Provider catalog](../plans/hilko-phase-1/decisions/01-provider-catalog.md) | Global seeded `providers`; assets optional link |
| [02 Onboarding draft](../plans/hilko-phase-1/decisions/02-onboarding-draft-storage.md) | `onboarding_drafts` in Postgres |
| [03 Search & impact](../plans/hilko-phase-1/decisions/03-search-and-impact.md) | ILIKE search; BFS list depth 8; F1 nav |
| Phase 0 stack | Nuxt, Drizzle `pg`, custom sessions, i18n `no_prefix` |

## User stories & flows

1. **Onboarding:** user opens wizard → autosaved draft → creates first project + draft assets/identities → lands on project map with “complete missing” prompts.
2. **Inventory:** CRUD identities, emails, provider accounts, assets; assign roles; link to projects/environments.
3. **Dependencies:** user links `depends_on`, `hosted_on`, etc. → impact API lists affected nodes.
4. **CSV:** upload → preview + secret column rejection → commit batch with rollback id.
5. **Dogfood:** run `db/seed` Mini Críptico → walk §4.4 questions in UI.

## Architecture touchpoints

- Extend `db/schema/` + new migration after F0 `0000_*`
- `server/api/` REST under existing Nitro patterns; Zod in `shared/schemas/`
- Extend shell nav (no empty modules)
- Reuse session `workspaceId` from Phase 0; consider `audit_events` on import and role changes

## Schema (additions to F0)

From spec §15, add tables:

`project_environments`, `providers` (+ seed), `identities`, `email_addresses`, `identity_emails`, `provider_accounts`, `provider_account_identities`, `provider_account_emails`, `asset_emails`, `asset_roles`, `asset_dependencies`, `config_entries`, `vault_references`, `verifications`, `onboarding_drafts`, `audit_events` (minimal).

`clients` table nullable on `projects.client_id` — **no UI**.

Enrich **`assets`**: `provider_id`, `provider_account_id`, `environment_id` (optional FK), `criticality`, `external_identifier`, `attributes_jsonb` (typed validation later).

Unique constraints per workspace; composite checks on junction tables.

## Behaviors

1. **Given** system providers seeded, **when** user picks Google in wizard, **then** asset links `provider_id` for Google slug, not a duplicate row.
2. **Given** Google A and B identities, **when** viewing YouTube vs Search Console assets, **then** roles/accounts show separately with verification badge.
3. **Given** same SES asset, **when** linked to a second project, **then** one `assets` row and two `project_assets` rows.
4. **Given** dependency chain within depth 8, **when** impact from VPS-01, **then** list shows relation types and `unverified` edges.
5. **Given** CSV with column `api_key`, **when** preview import, **then** batch rejected/redacted per `no-secrets`.
6. **Given** onboarding step 4 incomplete, **when** user returns, **then** draft restores from API.
7. **Given** workspace B user, **when** GET workspace A asset by UUID, **then** 404 without leak.

## Build tickets

### OR-1a — Schema migration + provider seed

- **Goal:** F1 tables + migrate + seed `providers` + extend `assets`.
- **Deps:** Phase 0 merged
- **Done means:** `bun run db:migrate` on dev DB applies F1 migration; seed includes Google/GitHub/AWS/Namecheap/etc.
- **Checklist:**
  - [ ] Drizzle schema + migration SQL
  - [ ] Seed script for system providers
  - [ ] Backfill-safe alter on `assets` / `projects` if needed

### OR-1b — Inventory CRUD APIs

- **Goal:** REST for environments, identities, emails, provider accounts, assets (full fields), roles, vault refs, config entries, verifications.
- **Deps:** OR-1a
- **Done means:** All entities scoped by session workspace; Zod validation; no secret fields accepted.
- **Checklist:**
  - [ ] Repositories per entity
  - [ ] PATCH/DELETE where spec expects lifecycle
  - [ ] Link asset ↔ project ↔ environment

### OR-1c — Inventory UI + nav

- **Goal:** List/detail pages per [03 Search & impact](../plans/hilko-phase-1/decisions/03-search-and-impact.md) nav set.
- **Deps:** OR-1b
- **Done means:** Home shows counts/pending; no Guías/Migraciones links.
- **Checklist:**
  - [ ] Accounts & identities views
  - [ ] Global assets table with filters
  - [ ] Project tabs per spec §5 (subset: overview, resources, dependencies list)

### OR-1d — Dependencies + impact API/UI

- **Goal:** CRUD `asset_dependencies`; impact list BFS.
- **Deps:** OR-1b
- **Done means:** Identity and asset impact endpoints; UI list with verification state.
- **Checklist:**
  - [ ] Relation type enum from spec §8
  - [ ] Max depth 8; cycle safe
  - [ ] Identity-centric view stub (same API)

### OR-1e — Onboarding wizard

- **Goal:** 5 steps spec §6; DB draft; step 1 only “My projects”.
- **Deps:** OR-1b, OR-1c
- **Done means:** Resume incomplete wizard; “not sure yet” saves null placeholders.
- **Checklist:**
  - [ ] `onboarding_drafts` API
  - [ ] Provider quick-pick uses system catalog
  - [ ] Finalize creates/updates entities atomically

### OR-1f — CSV import/export

- **Goal:** Preview/commit import; export filtered inventory.
- **Deps:** OR-1b
- **Done means:** Spec §6 CSV columns; batch id; secret scan.
- **Checklist:**
  - [ ] Preview endpoint
  - [ ] Commit with duplicate detection
  - [ ] Export CSV/JSON without secrets

### OR-1g — Search + Mini Críptico seed

- **Goal:** Paginated search; `db/seed/minicriptico.ts` fictional data.
- **Deps:** OR-1b
- **Done means:** §4 inventory placeholders; ≥10 dependency suggestions marked unverified.
- **Checklist:**
  - [ ] Search API
  - [ ] `bun run db:seed` command
  - [ ] Docs in README

### OR-1h — Tests (tenant + import)

- **Deps:** OR-1b, OR-1f
- **Done means:** CI runs vitest: cross-workspace denial on new routes; CSV secret rejection unit test.

---

## Suggested implementation order

```text
OR-1a → OR-1b → OR-1c + OR-1d (parallel UI) → OR-1e → OR-1f → OR-1g → OR-1h
```

**First OR to execute:** **OR-1a** (schema + provider seed).

Handoff: say **“fire OR-1a”** or **“implement F1”** to start code; use skills `domain-model`, `no-secrets`, `minicriptico-dogfood`.
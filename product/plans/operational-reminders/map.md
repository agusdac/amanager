# Actions & favorites — decision map

## Destination

**Actions:** short “how I do it again” notes (SSH, Docker, checklists) on **asset, project, or workspace** — simple list/read/edit, no runbooks.

**Favorites:** each user stars **assets, identities, emails, and actions** they touch often for a **Quick access** strip on Home (e.g. VPS + SSH action starred; rare logins like Namecheap left unstared).

**Contract:** [Feature brief](../features/actions.md) · [Spec](../specs/actions.md) · [v0.3.1 overview](../v0.3.1/overview.md)

## Notes

- **Domain:** Hilko already has **runbooks** (project-bound, templates, generation, execution, export). This feature is **not** that.
- **Existing hooks:** `runbook_steps.kind = command_suggestion` is for generated guide steps; `asset.description` is too shallow; `/api/dogfood/quick-links` is demo-only hardcoding.
- **Constraints:** workspace-scoped; [no-secrets](.cursor/skills/no-secrets/SKILL.md); metadata + placeholders only; i18n en/es for UI strings.
- **Feature slug:** `actions` (+ favorites in same release slice)
- **Target version:** `v0.3.1` — *Operational memory* (before Phase 3 migration).
- **Forge:** TBD (prepare-tea / gh when requested).

## Decisions so far

- [Entity vs runbook](./decisions/01-entity-vs-runbook.md) — table `actions`, not micro-runbooks; ships in **v0.3.1**.
- [Attachment scope](./decisions/02-attachment-scope.md) — asset, project, or workspace-global; one anchor per note; UI = simple picker, not multi-link.
- [Content & placeholders](./decisions/03-content-and-placeholders.md) — title + markdown; “Insertar del activo” on asset notes; copy on code blocks; no `{…}` syntax v1.
- [Discovery UX](./decisions/04-discovery-ux.md) — one list/read/edit pattern; tabs on asset + project; workspace list/filter.
- [Naming — Acciones](./decisions/05-naming-acciones.md) — UI **Acciones**; table `actions`.
- [User favorites](./decisions/06-user-favorites.md) — per-user stars on asset/identity/email/action; Home quick access.

## Locked for v1 (UI)

- Type icons on favorites; optional action `kind` icon; `pinned` first on asset tab.
- **Insertar del activo** on asset action edit (decision 03).
- Favorites **drag reorder**; asset **`?openAction=`** deep link.
- **“Solo este proyecto”** filter on favorites — **default off**.
- No empty-favorites coaching UX.

## Not yet specified

- Whether notes support **checklist items** (tick locally only vs persisted completion).
- **Search** indexing for actions body text.
- **Recent** vs favorites (recents automatic = out of scope v1; favorites manual only).
- **Promotion** path: “turn into runbook step” later or never.
- **Markdown variables** from asset attributes (`ipv4`, hostname) in v1 or v1.1.

## Product bar (locked)

**Simplicity of UI** over feature surface: one list, one read view, one edit form — no runbook chrome, no execution, no template wizard.

## Out of scope

- Executing commands in Hilko or storing credentials.
- Replacing Phase 3 migration plan engine.
- Full Notion-style wiki for the workspace.
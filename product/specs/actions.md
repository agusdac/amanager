# Actions & favorites (Acciones)

## Version & scope

**v0.3.1** · Feature slug `actions` · Ships with per-user **favorites** in the same release.

**Release gate:** User stars VPS + SSH action → both appear on Home and sidebar → drag order persists → open action favorite → read + copy in one navigation; save action with obvious secret → rejected.

Depends on **v0.2.0** inventory; does not require **v0.4.0** teams.

## Decisions locked

| # | Gist | Link |
|---|------|------|
| 01 | New `actions` entity, not micro-runbooks | [01](../plans/operational-reminders/decisions/01-entity-vs-runbook.md) |
| 02 | One anchor: asset, project, or workspace-global | [02](../plans/operational-reminders/decisions/02-attachment-scope.md) |
| 03 | Title + markdown; insert-from-asset; copy blocks; no `{…}` syntax; secret scan | [03](../plans/operational-reminders/decisions/03-content-and-placeholders.md) |
| 04 | One list/read/edit pattern; tabs + workspace list; favorites on Home + sidebar | [04](../plans/operational-reminders/decisions/04-discovery-ux.md) |
| 05 | UI **Acciones** / **Actions**; table `actions` | [05](../plans/operational-reminders/decisions/05-naming-acciones.md) |
| 06 | Per-user favorites; drag reorder; `?openAction=`; filter default off | [06](../plans/operational-reminders/decisions/06-user-favorites.md) |

**UI locked (map):** type icons; optional action `kind`; `pinned` first on asset tab; no empty-favorites coaching copy.

## User stories & flows

1. **Asset action:** User opens resource → **Acciones** tab → list (pinned first) → click → read markdown + **Copiar** on fences → Edit → save (lint).
2. **Create:** **Añadir** → sheet with anchor fixed when opened from asset/project tab; workspace list uses anchor picker (resource / project / workspace).
3. **Insert from asset:** On asset-anchored edit, **Insertar del activo** appends literal lines (name, admin URL, IPv4/hostname from `attributes_json`) at cursor.
4. **Project / global:** Project tab lists project-anchored actions; `/actions` shows all with chips Todos / Por proyecto / Por recurso.
5. **Favorite:** User toggles ★ on asset row → appears in Home + sidebar; toggles ★ on action row → navigate opens read view for that action.
6. **Reorder:** User drags favorites on Home or expanded sidebar → `PATCH` saves `position`; collapsed sidebar shows top N by position.
7. **Deep link:** User opens `/assets/:id?openAction=<actionId>` → asset page opens action read UI for that id if anchored to asset and readable.
8. **Filter:** With project focus in shell, user may enable **Solo este proyecto** on favorites (default **off**).

## Architecture touchpoints

- **Schema:** `db/schema/index.ts` — `actions`, `workspace_favorites`; migration via Drizzle.
- **API:** `server/api/actions/*`, `server/api/me/favorites.*`; Zod in `shared/schemas/actions.ts` (and favorites).
- **Secret scan:** Reuse `server/utils/secret-scan.ts` (`scanTextFields`) on action title + body before insert/update.
- **UI:** Shared `ActionListPanel` / `ActionReadSheet` / `ActionEditSheet` hosted on asset page, project page, `/actions`.
- **Favorites:** Composable `useFavorites()` (fetch list, toggle, reorder, project filter client-side or query param).
- **Shell:** `AppShell.vue` quick-access block between primary nav and footer (above workspace switcher).
- **Home:** `app/pages/home.vue` — **Accesos rápidos** card.
- **Stars:** Asset list + header; identity list/detail; email rows; action rows.
- **i18n:** `i18n/locales/en.json`, `es.json` — `actions.*`, `favorites.*`.

## Schema

### `actions`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `workspace_id` | uuid FK → workspaces | cascade |
| `title` | text | required, max ~200 |
| `body_markdown` | text | required, max ~32k |
| `asset_id` | uuid FK → assets nullable | exactly one of asset_id / project_id / neither |
| `project_id` | uuid FK → projects nullable | |
| `pinned` | boolean | default false; sort first on asset tab |
| `kind` | text nullable | `command` \| `checklist` \| `reference` — icon only |
| `created_by_user_id` | uuid FK → users | audit |
| `created_at`, `updated_at` | timestamptz | |

**Check (app + DB):** `(asset_id IS NOT NULL)::int + (project_id IS NOT NULL)::int <= 1` — global when both null.

Indexes: `(workspace_id, asset_id)`; `(workspace_id, project_id)`.

On asset delete → cascade delete actions where `asset_id` matches. Project delete → cascade project-anchored actions.

### `workspace_favorites`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `workspace_id` | uuid FK | |
| `user_id` | uuid FK | |
| `target_type` | text | `asset` \| `identity` \| `email_address` \| `action` |
| `target_id` | uuid | |
| `position` | integer | dense ordering per user+workspace; drag updates |
| `created_at` | timestamptz | |

Unique `(workspace_id, user_id, target_type, target_id)`.

On target delete → cascade favorite row. Resolve labels via join at read time (denormalize title optional later).

## API

Session required; active `workspace_id` from session. Foreign workspace UUIDs → **404**.

### Actions

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/actions` | viewer+ | List workspace actions; query `projectId`, `assetId`, `anchor=workspace` |
| POST | `/api/actions` | editor+ | Create; validate anchor + secret scan |
| GET | `/api/actions/:id` | viewer+ | Single action |
| PATCH | `/api/actions/:id` | editor+ | Update fields |
| DELETE | `/api/actions/:id` | editor+ | Delete |
| GET | `/api/assets/:id/actions` | viewer+ | Convenience list for asset tab |
| GET | `/api/projects/:id/actions` | viewer+ | Convenience list for project tab |

Request body (create/update): `title`, `bodyMarkdown`, `assetId?`, `projectId?`, `pinned?`, `kind?`.

**403** if viewer mutates. **400** if anchor invalid, both asset+project set, or secret scan fails.

### Favorites

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/api/me/favorites` | viewer+ | List with resolved `label`, `href`, `subtitle?`, `projectId?`, `targetType`, `position` |
| POST | `/api/me/favorites` | viewer+ | Body `{ targetType, targetId }`; append position = max+1 |
| DELETE | `/api/me/favorites/:id` | viewer+ | Remove |
| PATCH | `/api/me/favorites/reorder` | viewer+ | Body `{ items: [{ id, position }] }` full or partial reorder |

Toggle may be implemented as POST + DELETE on composite key if preferred; spec assumes row `id` from GET.

**400** if target not in workspace or not readable. **404** if favorite id not owned by user in workspace.

## Behaviors

1. **Given** editor on asset A, **when** POST action with `assetId=A`, **then** 201 and row appears on asset tab; **when** also `projectId`, **then** 400.
2. **Given** action with fenced code, **when** read view, **then** each block shows **Copiar** and copies text only.
3. **Given** body contains high-confidence secret pattern, **when** save, **then** 400 with i18n error (no row written).
4. **Given** two actions on same asset, one `pinned`, **when** list tab, **then** pinned sorts first regardless of `updated_at`.
5. **Given** user favorites action X, **when** GET favorites, **then** entry includes deep link to read view; **when** click from Home, **then** navigation opens read UI.
6. **Given** user favorites asset A, **when** navigate from favorite, **then** asset overview (no auto-open action).
7. **Given** `/assets/A?openAction=B` and B anchored to A, **when** load page, **then** read sheet for B open; **when** B wrong asset, **then** ignore or 404 on fetch.
8. **Given** user drags favorites order, **when** PATCH reorder, **then** subsequent GET reflects order on Home and sidebar.
9. **Given** project focus Northline and filter off, **when** GET favorites, **then** includes favorites from other projects; **when** filter on, **then** only favorites whose resolved `projectId` matches focus (or global emails/identities policy: include if unscoped).
10. **Given** asset deleted, **when** favorites referenced action on that asset, **then** cascade removes action favorites; asset favorite row removed.
11. **Given** viewer, **when** star toggle, **then** 200; **when** PATCH action, **then** 403.
12. **Given** workspace session, **when** GET action id from other workspace, **then** 404.

**Project filter resolution (v1):** Include favorite when `target_type` is `identity` or `email_address` (workspace-scoped rows), or when resolved `projectId` equals focus; asset/action inherit project from asset or project anchor.

## Build tickets

### OR-31a — Schema & action CRUD (asset tab)

- **Goal:** Migrations + API + asset **Acciones** tab (list/read/edit/delete) with pinned, kind, secret scan.
- **Deps:** none
- **Done means:** Editor can CRUD asset-anchored actions; viewer can read; pinned sorts first; save rejects obvious secrets.
- **Checklist:**
  - [ ] `actions` table migration + Drizzle model
  - [ ] Zod schemas + secret scan on write
  - [ ] `/api/actions` + asset-scoped list route
  - [ ] Asset tab UI (shared components)
  - [ ] i18n EN/ES for actions core strings

### OR-31b — Content affordances

- **Goal:** Read view markdown + per-block copy; **Insertar del activo** on asset edit.
- **Deps:** OR-31a
- **Done means:** User inserts inventory lines at cursor and copies SSH block from read view.
- **Checklist:**
  - [ ] `AppMarkdownPreview` + copy buttons
  - [ ] Insert-from-asset builder from asset GET payload
  - [ ] Edit sheet button + insertion behavior

### OR-31c — Favorites API & asset stars

- **Goal:** `workspace_favorites` + list/toggle + star on asset list/header.
- **Deps:** OR-31a
- **Done means:** User stars asset; GET returns row with label/href; unstar removes.
- **Checklist:**
  - [ ] Migration + model + uniqueness
  - [ ] GET/POST/DELETE (or toggle) routes
  - [ ] Star UI on assets + `useFavorites()` skeleton

### OR-31d — Home quick access + reorder

- **Goal:** Home card, drag reorder, project filter toggle (default off).
- **Deps:** OR-31c
- **Done means:** Order persists via PATCH; filter toggles client-side list.
- **Checklist:**
  - [ ] `PATCH /api/me/favorites/reorder`
  - [ ] Home card UI + dnd-kit (or existing pattern)
  - [ ] Filter toggle + i18n

### OR-31e — Sidebar quick access

- **Goal:** `AppShell` block synced with Home; collapsed icon mode.
- **Deps:** OR-31d
- **Done means:** Same favorites visible in sidebar; reorder works expanded.
- **Checklist:**
  - [ ] Placement above workspace switcher
  - [ ] Collapsed tooltips + cap visible rows
  - [ ] Shared composable with Home

### OR-31f — Project & workspace discovery

- **Goal:** Project tab **Acciones**; `/actions` workspace list with chips; CRUD for project/global anchors.
- **Deps:** OR-31a
- **Done means:** User manages project checklist and browses all actions in workspace.
- **Checklist:**
  - [ ] Project tab host
  - [ ] `/actions` page + nav link
  - [ ] Anchor picker on create from workspace list

### OR-31g — Stars on identities, emails, actions + deep link

- **Goal:** Stars on remaining types; `?openAction=` on asset page; favorite navigation for actions.
- **Deps:** OR-31c, OR-31b
- **Done means:** User stars SSH action and opens via favorite or query param.
- **Checklist:**
  - [ ] Star on identity/email/action rows
  - [ ] Asset route watches `openAction` query
  - [ ] Favorite hrefs for each `target_type`

### OR-31h — Tests & dogfood

- **Goal:** API tests for tenant isolation, anchor validation, favorites uniqueness, reorder, secret rejection.
- **Deps:** OR-31a–OR-31g
- **Done means:** CI covers critical behaviors 1, 3, 8, 11, 12.
- **Checklist:**
  - [ ] Vitest/h3 route tests
  - [ ] Seed: VPS SSH action + favorites for Northline demo user

## Open product questions (map only)

- Persisted checklist ticks; full-text search; auto recents; promote-to-runbook-step; `{ipv4}` template engine — not in v0.3.1.
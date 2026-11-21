## Question

How do **favorites** work for quick access to assets, identities, emails, and actions?

## Done means

We know scope (per-user vs workspace), entity types, where stars appear, and what Home shows.

## Type

grilling

## Status

closed

## Claimed by

none

## Blocked by

- [05 — naming acciones](./05-naming-acciones.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Per-user, per-workspace favorites** (not team-wide pins in v1). Your Namecheap login stays out of favorites; your VPS + its SSH action stay in.

### Model

Table `workspace_favorites` (name TBD):

- `workspace_id`, `user_id`
- `target_type`: `asset` | `identity` | `email_address` | `action`
- `target_id`: uuid
- `position`: integer — **v1 drag reorder** on Home + expanded sidebar (`PATCH` ordered positions)
- Unique `(workspace_id, user_id, target_type, target_id)`

Deleting target → cascade delete favorite rows.

### UX (minimal)

- **Star** on: asset list + asset header; identity list/detail; email row; action list row.
- **Home** card **Accesos rápidos** / **Quick access**: flat list (type icon + label + one-line context), drag to reorder, max ~12 visible + optional “Ver todos”.
- **Project filter:** toggle **“Solo este proyecto”** when shell project focus is set — **default off** (show all workspace favorites).
- **Sidebar** (`AppShell`): compact **same list** between primary nav and footer (above workspace switcher) — collapsed = icon stack + tooltips; expanded = ~6 rows + reorder + “Más”. Same API as Home.
- **Deep link (v1):** `/assets/:id?openAction=<actionId>` opens that action read view on the asset page.
- **Actions:** favoriting an **action** navigates to read view (asset/project context as anchored). Favoriting an **asset** goes to asset overview unless user uses `?openAction=` or favorites the action itself. User may favorite both VPS + “SSH desde portátil” action.
- No “smart” frequency tracking in v1 — manual star only.
- No dedicated empty-favorites onboarding copy in v1.

### i18n

`favorites.*`, `actions.*`; star `aria-label` add/remove favorite.
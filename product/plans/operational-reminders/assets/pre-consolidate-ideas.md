# Pre-consolidate ideas — Actions & favorites (v0.3.1)

Reference for brief/spec; aligned with user choices (pre-consolidate).

## Sidebar + Home (locked)

- Single source: `GET /api/me/favorites` (+ toggle `POST/DELETE`, reorder `PATCH`).
- **Sidebar:** block `Accesos rápidos` between primary nav and “More”, **above** workspace switcher. Collapsed: star column + 4–5 icon buttons.
- **Home:** same items, room for subtitles (e.g. action title under asset name).
- **Reorder:** drag-and-drop on Home and expanded sidebar to set `position` (v1).

## UX locked for v1

1. **Type icon always:** asset type badge, identity, email @, action kind icon — scan in &lt;1s.
2. **Project focus filter:** optional toggle **“Solo este proyecto”** when a project is selected in the shell; **default off** (favorites stay global within workspace).
3. **Pin within asset:** one `pinned` action sorts first on asset **Acciones** tab (separate from user ★).
4. **Action kind tag (optional):** `command` | `checklist` | `reference` — icon only, no extra workflow.
5. **Insertar del activo:** on asset action edit only — inserts literal lines from inventory (see decision 03).
6. **Deep link:** asset URL `?openAction=<uuid>` opens that action in read view (sheet or inline) — v1.
7. **Unfavorite everywhere:** star on row/header; shared `useFavorites()` keeps Home + sidebar in sync.

**Explicitly out (no dedicated UX):** empty-favorites onboarding copy / wizard — list can be empty with no extra guidance.

## UX defer (post-v1)

- Recent items (automatic) separate from stars.
- Workspace-shared “team pins” (admin).
- `/favorites` full page polish if deferred from v1 scope.

## Actions content ideas (non-blocking)

- **Duplicate action** to another asset (copy markdown, re-anchor).
- **Pair shortcut:** count “N acciones” from starred asset row (nice-to-have).

## Technical sketch

```
actions(workspace_id, title, body_markdown, asset_id?, project_id?, pinned bool, kind?)
workspace_favorites(workspace_id, user_id, target_type, target_id, position)
```

- RLS pattern: same as assets — workspace membership.
- Favorites: only targets user can already read (viewer can star read-only).
- Reorder: `PATCH /api/me/favorites` with ordered `{ id, position }[]` or dedicated reorder route.

## Build order (for spec OR-* tickets)

1. Schema + CRUD actions (asset tab only) + kind + pinned + insert-from-asset.
2. Favorites API + star on asset list + **drag reorder**.
3. Home quick access card + project filter toggle (default off).
4. Sidebar block + collapsed UX + same reorder.
5. Project tab Acciones + workspace list.
6. Star on identity/email + actions rows.
7. Asset route `?openAction=` handling.

## Anti-patterns

- Putting SSH secrets in action body (lint + education).
- Replacing runbooks / checklist page with actions.
- Global workspace pins without `user_id` (noise for teammates).
- Default-on project filter (hides cross-project shortcuts when focus changes).
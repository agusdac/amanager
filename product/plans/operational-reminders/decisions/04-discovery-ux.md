## Question

Where do users **see and edit** reminders so they are “set once, glance fast”?

Candidates: new tab on asset detail; collapsible card on asset Overview; project tab; workspace “Pins”; search hit; sidebar on Guides (separate from runbooks list).

## Done means

UX is **one pattern everywhere**: titled list → click → read (markdown preview) → optional “Edit” → title + textarea (+ anchor if creating from a hub). No second navigation model. Empty state is one sentence + one button.

## Type

grilling

## Status

closed

## Claimed by

none

## Blocked by

- [03 — content and placeholders](./03-content-and-placeholders.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Principle:** same UI component in three hosts; context pre-fills anchor.

| Where | Entry |
|-------|--------|
| Asset detail | Tab **Acciones** — list only; “Añadir” opens sheet with anchor fixed to asset |
| Project | Tab **Acciones** — anchor = project |
| Workspace | `/actions` or list under nav — filter chips: Todos / Proyecto / Recurso |
| Home | **Accesos rápidos** — user favorites (assets, identities, emails, actions), not all actions |
| Sidebar | Same favorites strip (compact); shared data with Home |

**Read view:** title, rendered markdown (`AppMarkdownPreview`), copy buttons on code blocks, link “Abrir activo/proyecto” if linked.

**Edit view:** title, markdown textarea, no toolbar beyond bold/list if needed (or plain markdown only).

**Actions (v1):** optional `kind` tag (`command` | `checklist` | `reference`) — icon only; optional `pinned` sorts first on asset tab.

**Favorites (v1):** drag reorder on Home + sidebar; asset deep link `?openAction=`.

**Not in v1:** drag-sort of workspace-wide action catalog across hubs, version history, comments, assignees.

Minimum path: Home favorite action → read + copy (1 click); or asset → tab → read (2 clicks).
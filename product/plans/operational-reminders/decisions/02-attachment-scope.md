## Question

What can a reminder attach to in v1?

Options to compare: **asset only**; **asset + project**; **asset + project + workspace-global**; optional **identity** or **provider account**.

## Done means

Attachment rules are fixed (including “one note vs many per anchor”, orphan notes when asset deleted, and team workspace visibility).

## Type

grilling

## Status

closed

## Claimed by

none

## Blocked by

none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**v1 anchors:** exactly one of per row (nullable FKs, one required):

| Anchor | Use |
|--------|-----|
| `asset_id` | “Cómo vuelvo a este VPS / repo / canal” |
| `project_id` (no asset) | Flujos del proyecto (publicar, responder mail del proyecto) |
| neither (workspace-global) | Pins del equipo (“antes de deploy en prod…”) |

- **Many notes** per asset and per project; globals kept scarce (soft cap ~10 in UI copy, not hard block v1).
- **Delete asset:** delete or cascade-delete notes bound only to that asset; project/workspace notes untouched.
- **UI priority:** attachment is a single dropdown on create (“Este recurso / Este proyecto / Workspace”) — no graph picker, no multi-link.
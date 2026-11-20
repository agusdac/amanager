## Question

What happens when members leave or are removed from a team workspace (especially the sole owner)?

## Done means

API rules for leave, remove, role change, and owner demotion are defined; UI can block invalid exits with clear copy.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [06-permission-matrix](./06-permission-matrix.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

### Leave (self)

- **viewer / editor / admin:** may **leave** anytime (`DELETE` self membership). Workspace data unchanged; they lose access.
- **owner:** may **not** leave while still the only owner. Must **promote another member to owner** first (can keep self as admin/editor or leave after).
- After ≥2 owners: an owner may leave if at least one other owner remains.

### Remove (admin action)

- **admin + owner** may remove any member except: cannot remove the **last owner**.
- Removing a member revokes access only; does not delete workspace content they created (projects keep `created_by_user_id` for audit).

### Demote / promote

- **admin + owner** may change roles except:
  - Cannot demote the **last owner** to a non-owner role.
  - Promoting someone to **owner** requires actor is **owner** (admin cannot create owners — align with matrix: admin manages invites but **owner-only** for promoting to owner).

**Refinement:** admin may invite and set initial role up to **admin**; only **owner** may grant **owner**.

### Workspace delete

- Only **owner** deletes workspace ([06](./06-permission-matrix.md)); requires confirm; all members lose access.

### v0.4.0 out of scope

- Bulk export on leave, reassign-all-content wizard, agency handover (Fase 5).
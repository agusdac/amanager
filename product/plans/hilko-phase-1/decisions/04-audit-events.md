# Audit events (F1 minimal)

## Decision

Write `audit_events` for high-risk mutations only in Phase 1:

- `import.commit` / `import.revert`
- `vault_reference.create`
- `asset_role.create`
- `project.delete`

Payload is **safe metadata** (`safe_diff_json`) — no secrets, no full CSV bodies.

## Deferred to F2+

- UI audit log viewer
- Auditing every PATCH/DELETE on inventory
- Retention / export policies
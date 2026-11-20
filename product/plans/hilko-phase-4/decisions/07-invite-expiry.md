## Question

How long is a workspace invitation link valid before it expires?

## Done means

API and emails can set `expires_at`; expired invites return a stable error; admins can re-send (new token / new row).

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [03-invite-flow](./03-invite-flow.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**TTL: 7 days** from create (or resend).

- Persist `workspace_invites.expires_at` (and `revoked_at` optional).
- Accept endpoint returns **410 Gone** (or **400** with code `invite_expired`) when past TTL or revoked; UI copy: ask admin for a new invite.
- **Resend** creates a fresh token (or rotates token) and resets `expires_at` to +7d; previous unconsumed token for same email+workspace is invalidated.
- No automatic extension on open — user must accept within window.

## Related

- [Permission matrix](./06-permission-matrix.md) — only admin+owner may invite/resend.
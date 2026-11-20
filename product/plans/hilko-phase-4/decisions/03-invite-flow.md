## Question

How do invitations work in slice 1?

## Done means

We know delivery channel, token behavior, and what happens for invitee with vs without an existing Hilko account.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- [02-mvp-first-slice](./02-mvp-first-slice.md)

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

- **Email** with a signed link (invite token persisted; **7-day TTL** — [07-invite-expiry](./07-invite-expiry.md)).
- **Dev:** Mailpit (same stack as password reset).
- **Invitee without account:** complete **register** (or login path after register) then accept → join team workspace with invited role.
- **Invitee with existing account:** **log in** (or already signed in) → **accept invite** without creating a new user; membership attached to existing user.
- Email on invite must match the invited address (or allow accept only when session email matches invite email — detail in implementation ticket).
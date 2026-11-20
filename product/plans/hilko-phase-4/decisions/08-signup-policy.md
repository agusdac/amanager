## Question

Who may create a new Hilko account in v0.4.0 (slice 1)?

## Done means

Implementers know default behavior, env toggle for self-hosted, and UX when registration is disabled but invite links still work.

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

**Default: open registration** (unchanged from today). Invite flow is additive — new users may register freely **or** land from an invite link and register/login before accept.

**Self-hosted knob:** runtime env `HILKO_ALLOW_PUBLIC_REGISTER` (default **`true`**).

- When **`false`:** hide `/register` and block `POST /api/auth/register` with **403** + code `registration_disabled`.
- **Invite path still works:** invitee without account uses a dedicated **invite accept → register** route (or register page with `?invite=` token) that is allowed even when public register is off — only with a **valid, non-expired** invite token (scoped to that email).
- **Login** always available.
- Document in `compose.prod.yml` / ops README; dev default stays open for dogfood.

## UX

- Login page: hide “Create account” when public register disabled; show “Use your invite link” helper.
- i18n EN/ES for disabled state.

## Related

- [Invite expiry](./07-invite-expiry.md)
- [Invite flow](./03-invite-flow.md)
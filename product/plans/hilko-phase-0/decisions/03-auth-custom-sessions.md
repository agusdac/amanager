## Question

Which auth approach for F0?

## Done means

Implementable design: Drizzle `users` + `sessions`, cookie session, signup policy defined.

## Type

grilling

## Status

closed

## Claimed by

user

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Custom sessions** (no Better Auth / Auth Utils). `Bun.password` argon2id for passwords; session token hashed in DB; HTTP-only cookie. Registration allowed only when zero users exist (first user = workspace owner). Password reset via email (Mailpit in dev). MFA before external users — not in F0.
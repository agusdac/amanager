## Question

What runs in Docker Compose for dev vs prod?

## Done means

Two compose files match ROADMAP; dev keeps Nuxt on host for HMR.

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

**compose.dev.yml:** PostgreSQL 16 + Mailpit. App: `bun dev` on host. **compose.prod.yml:** app image (bun) + PostgreSQL + Caddy (HTTPS).
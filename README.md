# amanager (AccessMap)

Digital infrastructure map — metadata only, no stored credentials.

## Docs

- [Product spec](docs/ACCESSMAP_SPEC_CURSOR.md)
- [Roadmap](docs/ROADMAP.md)
- [Phase 0 pathfinder map](product/plans/accessmap-phase-0/map.md)

## Local development (Fase 0)

1. Start data services:

   ```bash
   docker compose -f compose.dev.yml up -d
   ```

2. Copy env and install:

   ```bash
   cp .env.example .env
   bun install
   ```

3. Apply schema:

   ```bash
   bun run db:push
   ```

4. Run the app (Postgres + Mailpit stay in Docker):

   ```bash
   bun run dev
   ```

- App: http://localhost:3000
- Mailpit UI: http://localhost:8025

First registration creates the owner and a **Personal** workspace; further signups are blocked unless `NUXT_ALLOW_SIGNUP=true`.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Nuxt dev server |
| `bun run db:push` | Push Drizzle schema to Postgres |
| `bun run db:migrate` | Apply migrations (`0000`–`0002` F1) |
| `bun run db:seed` | Seed system `providers` |
| `bun run db:seed -- --workspace=<uuid>` | Fictional Mini Críptico inventory (idempotent) |
| `bun scripts/list-workspaces.ts` | List workspace UUIDs for seeding |
| `bun run test` | Vitest (workspace isolation + CSV secret scan) |
| `bun run build` | Production build |

## Production compose (skeleton)

```bash
docker compose -f compose.prod.yml up --build
```

Set `POSTGRES_PASSWORD`, `NUXT_SESSION_SECRET`, and Caddy host in `.env` before deploying.
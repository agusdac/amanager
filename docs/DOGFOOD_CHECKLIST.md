# Dogfood checklist — Northline demo (spec §4.4)

Use the in-app page **`/checklist`** for interactive progress (saved in your browser). Answer each item from Hilko data only — no secrets.

| # | Question | Primary UI |
| --- | --- | --- |
| 1 | Which services use Workspace admin vs Cloud billing? | Emails & access → identities, Northline project roles |
| 2 | Impact of losing Team inbox | Emails tab; Impact by identity / linked assets |
| 3 | Where is Google OAuth configured? | Asset «Google OAuth client», vault ref, config entries, environments |
| 4 | YouTube channel and admin identities | YouTube asset + roles |
| 5 | Search Console + northline.example verification | GSC + domain assets |
| 6 | Registrar vs DNS vs mailbox vs SES | Impact on domain, mail, SES |
| 7 | VPS ↔ repos, SSH vault ref | VPS, GitHub assets, dependencies |
| 8 | Image storage consumer | Cloudflare storage asset |
| 9 | Onboard dev without sharing passwords | Roles, vault refs (runbooks F2) |
| 10 | Pre-migration impact (GitHub, registrar, OAuth) | Impact lists (plans F3) |

**Phase 1 exit:** all 10 marked reviewed with traceable answers in the app.

**Re-seed (dev):** `bun run db:seed --workspace=<uuid>` replaces the **Northline** demo dataset in that workspace (`northline-demo` slug).

Reference: [HILKO_SPEC_CURSOR.md](./HILKO_SPEC_CURSOR.md) §4.4, [ROADMAP.md](./ROADMAP.md) Fase 1.
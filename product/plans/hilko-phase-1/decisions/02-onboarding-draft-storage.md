## Question

Where is the 5-step onboarding wizard state stored between sessions?

## Done means

Users can leave and resume onboarding; spec §6 success criteria are achievable.

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

**Postgres table** `onboarding_drafts`: one row per workspace (or per project being onboarded), `step` (1–5), `payload_jsonb` (validated partial data), `updated_at`. API autosave on step change. **No** localStorage as source of truth. Completed wizard marks draft `completed_at` or deletes draft after successful commit.
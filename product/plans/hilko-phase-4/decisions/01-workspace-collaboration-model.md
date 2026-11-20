## Question

How should two people collaborate in v0.4.0 given personal workspaces already exist?

## Done means

We can describe, without ambiguity, where inventory lives (personal vs team), how the active workspace is chosen in the app, and whether v0.4.0 includes copying a personal project into a team workspace with preview.

## Type

grilling

## Status

closed

## Claimed by

user (2026-11-20)

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

**Option D (hybrid).**

- Each user keeps a **personal** workspace (unchanged default).
- Users can create or join **`team`** workspaces (`workspaces.type = team`).
- The app shell exposes a **workspace switcher**; session/context scopes all queries to the active workspace.
- v0.4.0 includes **explicit copy** of a **project** from personal → team with a **preview step** (spec §14: review vault refs, emails, private notes; no automatic sharing of personal assets).
- Invitations and `owner|admin|editor|viewer` membership are in scope for the same milestone (details in follow-on tickets).
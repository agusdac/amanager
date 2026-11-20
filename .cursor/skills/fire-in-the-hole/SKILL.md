---
name: fire-in-the-hole
description: Kick off implementation after feature-planner has produced product docs. Use when the user says start development, kick off implementation, build the next ticket, implement this planned feature, ship the next slice, fire in the whole or work from product/features and product/specs. Also use right after feature planning is done, when tickets.md exists and the user wants code—not more specs. Prefer this over jumping straight into TDD when product/ artifacts are the source of truth. One ticket or vertical slice at a time; never implement the whole feature in one run unless the user explicitly asks.
---

# Start Development
You are a Senior Implementation Lead. Turn **feature-planner** outputs into shipped code **one ticket or vertical slice at a time**, with security and architecture guardrails enforced before the first edit.

Planning lives in `product/`. This skill owns **implementation kickoff and slice execution**, not re-planning the feature.

## When to use
- `product/features/<slug>.md` and `product/specs/<slug>/` already exist.
- User wants to **start coding**, **build the next ticket**, **fire in the hole** or **continue** a partially implemented feature.
- User finished **feature-planner** and is ready for development.

## When not to use
- No feature slug or spec folder yet → use **feature-planner** first.
- User only wants planning, API design, or changelog updates → **feature-planner**.
- User wants a post-merge cleanup pass only → **release-refactor-review**.
- User wants to stress-test an idea before planning → **grill-me**.

## Context detection
Extract from the conversation first:

- Feature slug (explicit name, branch name, or path under `product/specs/`).
- Target version from `product/features/_changelog.json` or the feature brief.
- Whether a specific ticket number or title was named.
- Whether the user forbade or requested Gitea issues, branches, or commits.

If multiple features or versions match, ask throughly before proceeding.

## Workflow

### 1. Anchor to product docs
Read in this order:

1. `product/features/_changelog.json` — confirm version and that the slug is listed.
2. `product/features/<slug>.md` — value, requirements, constraints, dependencies.
3. `product/specs/<slug>/spec.md` — flows, components, scope boundaries.
4. `product/specs/<slug>/api.md` — when the slice touches HTTP.
5. `product/specs/<slug>/schema.md` — when the slice touches persistence.
6. `product/specs/<slug>/tests.md` — behaviors to verify for this slice.
7. `product/specs/<slug>/tickets.md` — ordered implementation plan.

**Docs win over chat memory.** If the user contradicts the spec, confirm whether to update product docs first or proceed with an explicit override.

Briefly report: target version, feature slug, chosen ticket, and mapped behavior(s) from `tests.md`.

### 2. Select one slice
From `tickets.md`:

- Default: first ticket whose checklist items are not all done (infer from repo state if possible).
- If you detect a priority ticket, ask the user to validate if makes sense prioritize that ticket over another one.
- User override: the ticket they named.

For that ticket only:
- State **goal**, **scope**, **dependencies**, and **definition of done**.
- Map to the **highest-priority** behavior(s) in `tests.md` that this ticket unlocks.
- Confirm slice boundary with the user before any code edit unless they already named the exact ticket and said to proceed.

Do not pull in later tickets, “while we're here” refactors, or adjacent features.

### 3. Security and architecture preflight
Before writing code, verify the slice against constraints in the brief and spec. Flag blockers to the user.

| Area | Check |
|------|--------|
| Multi-tenant | Every read/write scoped by `workspaceId` (or equivalent); no cross-tenant queries or responses. |
| Auth | Endpoints and jobs validate session/API key; reject missing or invalid auth. |
| Audit | State changes that matter for compliance are traceable (IDs in logs, not raw content). |
| Logging | No raw PII, document body, embeddings, tokens, or secrets in logs. |
| Data retention | Deletes and purges align with spec when removing user data. |
| Injection | Parameterized queries (Drizzle); validated inputs at the edge (Pydantic/Zod as applicable). |
| SSRF / paths | Allowlisted URLs; sanitized object keys and file paths. |

**Nuxt / Bun worker / FastAPI** — follow existing layout:

- HTTP: versioned routes under `/api/v{n}/...`, thin handlers, logic in `server/services/*.service.ts`.
- DB: schemas in shared `packages/db` or at `frontend/server/db/schemas/*.schema.ts`, migrations generated into the app migration folder, PostgreSQL only.
- Tests and infra: Docker-first; run via Compose where the project expects it; use `bun` / `bunx` for Node tooling.

If mapping, auth model, or schema ownership is unclear, run a short **grill-me** round (3–6 questions) or ask targeted questions—do not guess on security boundaries.

### 4. Optional forge kickoff (explicit approval)
Side effects require **explicit user approval each time**:

| Action | Default | Skill |
|--------|---------|--------|
| Create/sync Gitea issues from `tickets.md` | Ask first | **prepare-tea** |
| Create branch | Ask first | — |
| Commit / push | Ask first | — |

When the user approves issue creation for the current slice:

- Draft title and body from the ticket (goal, scope, DoD, links to `product/specs/<slug>/`).
- Include **Working branch** per prepare-tea rules.
- Use at least one default label (`enhancement` for feature work unless clearly `bug`).
- Do not put secrets or raw PII in issue bodies.

If the user declines issues, continue with implementation only.

### 5. Implement with TDD
Invoke **[tdd](../tdd/SKILL.md)** for the mapped behavior(s):

- One test → minimal implementation → repeat (vertical slices, not horizontal “all tests then all code”).
- Tests assert **observable behavior** through public interfaces.
- Only code required for the current test; no speculative APIs.

Align implementation with `api.md` and `schema.md` when the slice defines contracts. If the spec and codebase disagree, surface the gap before widening scope.

### 6. Close the slice
1. Run **lint and tests** for touched packages (prefer project-standard Docker Compose commands when that is how CI runs them).
2. Invoke **[release-refactor-review](../release-refactor-review/SKILL.md)** on the slice diff: reuse, ownership, module boundaries—behavior preserved.
3. Report using the template below.

If the slice cannot meet DoD without expanding scope, stop and propose splitting the ticket or updating `tickets.md` via feature-planner—not silent scope creep.

## Slice completion report
Always end a slice with:

```markdown
## Slice complete

- **Version:** vX.Y.Z
- **Feature:** <slug>
- **Ticket:** <n> — <title>
- **Behaviors covered:** <from tests.md>
- **Tests run:** <commands and result>
- **Forge:** issues created / skipped / pending approval
- **Gaps:** <anything left in ticket checklist>
- **Next slice:** <ticket n+1 or "feature complete">
```

## Guardrails
- Never implement from vague chat when `product/specs/<slug>/` exists.
- Never silently widen beyond the selected ticket.
- Never log raw PII, document content, tokens, embeddings, or secrets.
- Never create issues, branches, commits, or pushes without explicit approval.
- Never skip security preflight for persistence, auth, or cross-tenant paths.
- Never replace feature-planner for spec or ticket authoring mid-slice—flag doc drift instead.

## Skill handoffs
| Need | Skill |
|------|--------|
| Missing or stale specs | feature-planner |
| Red-green-refactor execution | tdd |
| Gitea issues / releases | prepare-tea |
| Ambiguous design or security | grill-me |
| Post-slice reuse and boundaries | release-refactor-review |

## Principles
- **One slice at a time** — predictable progress and reviewable diffs.
- **Product docs as contract** — requirements, tests, and tickets stay aligned.
- **Secure by default** — tenant scope and least logging before convenience.
- **Thin transport, thick services** — endpoints orchestrate; services own rules and DB.
- **Prove behavior** — tests from `tests.md`, not imagined coverage.
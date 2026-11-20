---
name: release-refactor-review
description: After implementing or editing code, run a cleanup pass that maps a concrete changelog version in `product/` to the related code changes, then refactors for reuse, cleaner interfaces, stronger module boundaries, and better software design without changing product behavior. Use when the user wants a post-change refactor, horizontal DRY pass, maintainability/design cleanup, interface or module consolidation, or asks to align "what just changed" with a planned release in `product/`. If the refactor boundary, behavior freeze, or public contract is unclear, start a short `/grill-me` style clarification round focused only on the missing decisions.
---

# Post-change reuse and design cleanup

You are doing a **horizontal** cleanup pass: changed code is the anchor, the **whole repo** is the search space for reuse, and the target changelog version in `product/` is the product-intent guardrail. Prefer deleting, merging, or rewiring to existing building blocks over adding new parallel implementations.

This skill is not only about removing duplicate code. It is also about improving **software design** around the latest changes: clearer ownership, tighter interfaces, better module boundaries, less leakage across layers, and fewer accidental abstractions.

## When to use this skill

- Right after a feature slice, before merge, or when the user points at "what I just changed."
- When new code **reimplements** something that already exists: helpers, composables, validators, service calls, endpoint orchestration, DTOs, shared types, wrappers, or tiny modules.
- When the user wants **fewer lines** without changing product behavior.
- When the user wants a cleanup focused on **design**, **interfaces**, **modules**, **ownership**, or **architecture**, not just DRY.
- When the user wants the cleanup tied to a specific release or feature already tracked in `product/`.

## When not to use

- Greenfield code with no clear duplication, no concrete change set, and no stable extraction target.
- Behavioral bugs or missing tests that must be solved first; this skill assumes behavior is correct or explicitly frozen.
- Broad speculative rewrites detached from a real diff, feature, or version anchor.

## Workflow

### 1. Lock the refactor anchor

Establish two anchors before editing:

1. The **change set**.
2. The **target product version** in `product/`.

Default precedence:

- Explicit file list, commit range, feature slug, or version from the user.
- `git diff` against the merge base or the **last 1–3 commits** if the user said "what I just changed."
- A concrete feature slug or touched files under `product/specs/` or `product/features/`.
- The newest `unreleased` or `frozen` version in `product/features/_changelog.json` only if the cleanup is clearly about current shipping work.

Always read `product/features/_changelog.json` and map the cleanup to a specific version. Record:

- target version
- feature slug(s), if known
- in-scope file list
- behavior freeze: strict freeze, cleanup-only, or small safe interface changes allowed

If you cannot confidently map the cleanup to a version, ask before editing.

### 2. Start a quick `/grill-me` round when needed

If repo exploration does not answer the important design constraints, run a short clarification round before refactoring. Keep it sharp: **3-6 high-leverage questions max**.

Good triggers for grilling:

- It is unclear whether behavior is fully frozen.
- It is unclear which interfaces are public and must stay stable.
- It is unclear whether the user wants the smallest diff or a stronger structural cleanup.
- Multiple modules look like valid owners for the same behavior.
- The version/feature mapping is ambiguous.

Good question themes:

- Which version or feature should this cleanup stay inside?
- Are interface simplifications allowed if behavior stays the same?
- Which APIs, components, composables, or service functions are considered stable contracts?
- Should we optimize for fewer modules, stronger boundaries, or minimal risk?
- Is cross-feature extraction allowed, or should this stay inside one release slice?

If the repo answers the question, do not ask it.

### 3. Read the product intent and changed code in full

Open the **entire** touched files, not only the diff hunk.

Also read the release context:

- `product/features/_changelog.json`
- `product/<version>/overview.md`
- `product/<version>/changelog.md`
- relevant `product/features/<slug>.md` or `product/specs/<slug>/spec.md` when the feature slug is known or the cleanup is tightly coupled to a planned feature

Use these docs as guardrails. The cleanup should make the implementation **clearer and easier to ship**, not silently drift away from the planned feature behavior or release shape.

### 4. Horizontal discovery is mandatory

For each meaningful chunk in the change set, search the codebase before keeping it local:

| Signal in the change | Search strategy |
|----------------------|-----------------|
| HTTP / `$fetch` / `useFetch` | Search for the same path, method, payload, or response shape; find existing composables, services, or stores. |
| Validation / normalization | Search for the same field names, errors, parsing, or `createError` patterns; check `server/utils`, `shared/`, and neighboring services. |
| DB access in endpoints | Find `server/services/*.service.ts` or existing query helpers; endpoint should stay thin. |
| Interface / type duplication | Search for repeated DTOs, payload types, response shapes, and domain vocabulary; identify the real owner. |
| Module boundary leaks | Search for UI importing server-ish concepts, endpoints doing orchestration, or services carrying transport details. |
| Vue duplication | Search for existing base components, composables, or repeated template patterns. |
| Pinia actions / orchestration | Search for repeated fetch-flow-state sequences before adding another store-local workflow. |
| Tiny wrappers / micro-modules | Search for nearby modules with nearly identical responsibilities; merge when the split is artificial. |

Use **semantic search** when the duplication is behavioral, architectural, or ownership-based. Use **grep** for exact strings, routes, types, and error messages.

### 5. Run a design-focused cleanup review

Read `SOFTWARE-DESIGN.md` before making design-heavy cleanup decisions. Use it as the stable philosophy for evaluating complexity, functional core boundaries, deep modules, simple interfaces, information hiding, and behavior-preserving refactors.

For every meaningful chunk of changed logic, ask:

- Who should own this behavior?
- Is there one obvious public interface?
- Are we duplicating contracts or naming the same concept differently across layers?
- Does the module boundary match the domain, or is it accidental?
- Is transport leaking into business logic, or persistence leaking into UI-facing code?
- Can two small modules become one clearer owner?
- Can a broad public surface become narrower without changing behavior?
- Does this refactor reduce cognitive load for the version we are shipping?

Prefer removing accidental complexity over extracting more helpers.

### 6. Refactor decisions

- **Replace** a local copy with an existing function, composable, service, schema, or type when the contract already fits or can fit with one thin adapter.
- **Merge** tiny modules when the split creates indirection without a meaningful boundary.
- **Extract** a new shared helper or contract only if there are **at least two real call sites** now, or a clearly stable boundary the version needs.
- **Move** interfaces, types, and helpers to the layer that actually owns the concept.
- **Narrow** exports and public entry points when wide module surfaces are creating confusion.
- **Leave** code local when extraction would create speculative APIs, version-crossing coupling, or a fake abstraction.

Respect the user's rules: **no drive-by refactors** outside the change set unless the duplication or boundary problem is directly coupled to the changed code.

### 7. Keep the version mapping explicit

When you report the cleanup, always state:

- target version
- feature slug(s), if any
- files treated as in scope
- what was deduplicated
- what interface, ownership, or module boundary became clearer
- whether the cleanup stayed behavior-preserving

If the cleanup reveals a mismatch between the code and the mapped `product/` version docs, flag it clearly. Update the relevant product docs only if the user asked for docs to stay in sync as part of the cleanup.

### 8. Verify

- Run the relevant **lint** and **tests** for the touched area.
- Do not change public API or UX unless the user asked for it.
- Re-check that the cleanup still fits the mapped `product/` version and feature intent.

## Principles

- **Same behavior**: refactors are behavior-preserving unless the user explicitly allows fixes.
- **Version-aware**: anchor the cleanup to one concrete version in `product/`, not a vague sense of "recent work."
- **Shorter, clearer, better owned**: fewer lines, clearer names, stronger ownership, one obvious path.
- **Design over churn**: prefer better module boundaries and interfaces over cosmetic edits.
- **Project shape**: follow existing Nuxt and server layout, shared services, and neighboring naming patterns.
- **Explain briefly**: say what now owns the logic and why the structure is better. No essay.

## Anti-patterns

- Renaming unrelated symbols or reformatting whole files "while you're here."
- Copy-pasting a giant helper into `utils` without checking for an existing owner.
- Extracting abstractions with only hypothetical reuse.
- Keeping duplicate DTOs, validators, or wrappers just because they live in different folders.
- Refactoring across versions or features without checking the `product/` mapping first.
- Skipping a needed clarification round when public contracts or refactor boundaries are ambiguous.

## Optional quick checklist before you finish

- [ ] The cleanup is anchored to a concrete version from `product/features/_changelog.json`.
- [ ] The in-scope changes and version mapping are explicit.
- [ ] Every new API-ish or interface-ish block in the diff has been searched for an existing owner or twin.
- [ ] No new duplicate of validation, transport contracts, or module boundaries was introduced.
- [ ] The cleanup improved ownership, interfaces, or module structure, not just line count.
- [ ] Tests and lint still pass for touched packages.
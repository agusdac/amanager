## Question

How does **workspace project focus** interact with import?

## Done means

Spec states default target, new-project path, and how `project` column behaves in each mode; scoped navigation does not fight import UX.

## Type

grilling

## Status

closed

## Claimed by

—

## Blocked by

- none

## Forge

- Gitea: TBD
- GitHub: TBD

## Answer

Import is **project-aware** and aligns with the topbar project selector:

1. **Scoped default:** When a project is focused, import **defaults** to that project (rows missing `project` inherit focus; rows naming another project are **errors or require explicit override** — spec to pick strict vs warn; **recommend strict in scoped mode** except “new project” flow below).
2. **New project target:** User can choose **“Create new project and import here”** (name slug from user input). All rows in the batch attach to that new project regardless of focus; column `project` may be omitted or must match the new name — spec to normalize.
3. **All projects:** When focus is “all projects”, column `project` is required per row (today’s behavior, improved UX).

Creating a **new** project via import is in scope; importing into **multiple existing projects in one batch** remains in scope when focus is “all projects”.
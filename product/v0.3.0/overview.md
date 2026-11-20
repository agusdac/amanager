# v0.3.0 — Runbooks & setup README

Setup runbooks from inventory: three system templates, editable Markdown, manual execution history, locale-aware Markdown export.

## Scope

- Fase 2 per [docs/ROADMAP.md](../../docs/ROADMAP.md) (OR-2a … OR-2g)
- Exit: spec **§21** and **§26.B**
- Depends on **v0.2.0** inventory (projects, envs, assets, vault refs, config entries)

## Features

- [hilko-phase-2](../features/hilko-phase-2.md)

## In scope

- Generator with pending-inventory callouts (no invented OAuth/hosts)
- Execution default **snapshot**; optional **live** at start
- Guides nav + project Runbooks tab + home card
- Minimal `audit_events` on runbook lifecycle (no viewer)

## Out of scope (F3+)

Migration plan engine, GitHub/README repo import (spec V1), command runner, per-asset guide panel, audit log UI, workspace-global runbooks without project.
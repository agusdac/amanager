# Changelog — v0.4.0

All notable changes for team collaboration. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Team workspaces with membership roles (`owner`, `admin`, `editor`, `viewer`) and workspace switcher ([hilko-phase-4](../features/hilko-phase-4.md)).
- Email invitations with 7-day expiry, resend, and accept flow for new and existing users.
- Permission matrix enforced in API (viewer read + exports; editor delete own projects only).
- Copy project from personal workspace to team with categorized preview, sensitivity flags, and secret scanner blocks.
- Optional assignees on verifications and runbook steps (template default + execution override).
- Team settings **Activity** feed for admins (collaboration audit events).

### Changed

- Session binds an active workspace across personal and team contexts (no longer personal-only).

### Security

- Cross-workspace resource access remains **404**; role violations **403**.
- Optional `HILKO_ALLOW_PUBLIC_REGISTER` to disable public signup while keeping invite-based registration.
---
name: no-secrets
description: >-
  Enforce AccessMap metadata-only storage. Use when writing forms, CSV import/export,
  seeds, logs, API handlers, exports, config_entries, vault fields, or any user input.
---
# No secrets in AccessMap

**Principle:** metadata, not credentials. AccessMap is not a password manager.

## Never store, log, or export

- Passwords, API keys, tokens (access/refresh), private SSH keys, 2FA/recovery codes
- EPP/domain transfer codes, session cookies, OTP seeds, passkeys
- Full `.env` contents or Bitwarden vault dumps
- Values that look like secrets even if the user pasted them

## Allowed

- Variable **names** (`GOOGLE_CLIENT_ID`, `DATABASE_URL` as label only when non-secret)
- Vault **references**: `vault_provider`, `label`, `location_hint` (e.g. "Bitwarden > Mini Críptico > AWS SES prod")
- Public/non-secret metadata: region, URLs without auth query params, masked public IDs
- `admin_url` / `public_url` validated; strip tokens from URLs

## Implementation checks

1. **CSV import:** scan column names and cell patterns; reject or redact suspicious columns; block batch commit if secrets detected.
2. **API:** Zod max lengths; reject fields named `password`, `secret`, `token`, `private_key`, etc. unless explicitly vault reference type.
3. **Logs:** never log request bodies for config/import routes before filtering.
4. **Exports:** same rules as DB; optional hide even public client IDs in shared exports.
5. **Seeds:** fictional labels only; no real emails/passwords from the author.

## When unsure

Classify as **vault reference** or reject. Do not persist "for debugging".
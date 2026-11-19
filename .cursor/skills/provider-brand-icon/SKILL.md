---
name: provider-brand-icon
description: >-
  Adds or updates provider and asset-type brand icons in AccessMap using Simple
  Icons (official brand SVGs). Use when adding a new provider in db/seed/providers.ts,
  a new asset type with a known product, or when the user asks for service logos/icons.
---

# Provider brand icons (AccessMap)

## Policy

- **Referential UI only** — icons identify inventory entries, not imply partnership with the brand.
- **No secrets** in icon assets or alt text.
- **Trademark**: Simple Icons SVGs are CC0; the **brand mark** may still be trademarked. Read [Simple Icons DISCLAIMER](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md) and the vendor’s trademark page when unsure.
- Prefer **Simple Icons** ([simpleicons.org](https://simpleicons.org)) over random PNG scrapes.

## Default implementation

| Piece | Location |
| --- | --- |
| Provider slug → icon | `app/constants/brandIcons.ts` → `PROVIDER_BRAND_ICONS` |
| Asset type → product icon | `app/constants/brandIcons.ts` → `ASSET_TYPE_BRAND_ICONS` |
| UI | `BrandIcon.vue`, `AssetTypeLabel.vue` (brand SVG first, glyph fallback) |
| Provider list | `db/seed/providers.ts` (`slug` must match map keys) |

Resolution order in `resolveBrandIcon()`: **asset type** (e.g. `search_console`) → **provider slug** → fallback glyph.

## When adding a new provider

1. **Search** [simpleicons.org](https://simpleicons.org) for the brand name (try abbreviations; e.g. Search Console → `googlesearchconsole`).
   - **Note:** AWS/Amazon may be absent from Simple Icons (use glyph fallback or vendor-approved asset until an icon exists).
2. If found, note the **slug** on the site (e.g. `googlesearchconsole`) and the **Simple Icons export name** (e.g. `siGooglesearchconsole`).
3. Open the brand’s **trademark / brand guidelines** (linked from Simple Icons card when available). Confirm referential use in a product map is acceptable; if not, keep the generic type glyph only.
4. Add the provider to `db/seed/providers.ts` with a stable `slug` (lowercase, no spaces).
5. In `app/constants/brandIcons.ts`:
   - `import { si… } from 'simple-icons'` (named export)
   - Add `slug: si…` to `PROVIDER_BRAND_ICONS`
6. If the icon is missing from Simple Icons: open a [Simple Icons icon request](https://github.com/simple-icons/simple-icons/issues/new?template=icon_request.yml) or use **glyph fallback** until merged — do not hotlink random CDNs.
7. Run `bun run build` to verify tree-shaken imports resolve.

## When adding a new asset type tied to a product

1. Add i18n `assets.types.*` and `assets.typeDescriptions.*` (see `i18n-en-es` skill).
2. If the type is always a specific product (e.g. `search_console`), map it in `ASSET_TYPE_BRAND_ICONS` even when `provider` is `google`.
3. Add the type to `app/constants/inventory.ts` `ASSET_TYPE_KEYS` if it appears in forms.

## Checklist (copy for PR)

- [ ] `providers.slug` matches `PROVIDER_BRAND_ICONS` key
- [ ] Simple Icons import builds on client + Nitro
- [ ] Trademark note in PR if non-obvious (AWS, Cloudflare, Google, etc.)
- [ ] UI spot-check: `/assets`, project asset list, asset detail header

## References

- Vendor guidelines (examples): [Google](https://about.google/brand-resource-center/), [GitHub](https://github.com/logos), [AWS trademarks](https://aws.amazon.com/trademark-guidelines/), [Cloudflare trademark](https://www.cloudflare.com/trademark/)
import type { SimpleIcon } from 'simple-icons'
import {
  siBitwarden,
  siCloudflare,
  siGithub,
  siGoogle,
  siGoogleads,
  siGooglesearchconsole,
  siHostinger,
  siInstagram,
  siLinux,
  siMinutemailer,
  siNamecheap,
  siOpenid,
  siTiktok,
  siYoutube,
} from 'simple-icons'

/** Maps `providers.slug` (see db/seed/providers.ts) → Simple Icons entry. */
export const PROVIDER_BRAND_ICONS: Record<string, SimpleIcon> = {
  google: siGoogle,
  github: siGithub,
  // AWS: no Amazon/AWS entry in Simple Icons v16 — glyph fallback until icon added (see provider-brand-icon skill).
  cloudflare: siCloudflare,
  namecheap: siNamecheap,
  hostinger: siHostinger,
  youtube: siYoutube,
  instagram: siInstagram,
  tiktok: siTiktok,
  bitwarden: siBitwarden,
  vps: siLinux,
  email: siMinutemailer,
}

/** Asset types with a well-known product icon (when provider alone is ambiguous). */
export const ASSET_TYPE_BRAND_ICONS: Record<string, SimpleIcon> = {
  search_console: siGooglesearchconsole,
  google_ads: siGoogleads,
  youtube_channel: siYoutube,
  oauth_client: siOpenid,
}

export function resolveBrandIcon(
  providerSlug?: string | null,
  assetType?: string | null,
): SimpleIcon | null {
  if (assetType && ASSET_TYPE_BRAND_ICONS[assetType]) {
    return ASSET_TYPE_BRAND_ICONS[assetType]
  }
  if (providerSlug && PROVIDER_BRAND_ICONS[providerSlug]) {
    return PROVIDER_BRAND_ICONS[providerSlug]
  }
  return null
}
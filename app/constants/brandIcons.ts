import type { SimpleIcon } from 'simple-icons'
import {
  si1password,
  siAnthropic,
  siBitwarden,
  siCloudflare,
  siContabo,
  siCursor,
  siDashlane,
  siDeepseek,
  siDigitalocean,
  siFigma,
  siGithub,
  siGooglegemini,
  siGoogle,
  siGoogleads,
  siGooglesearchconsole,
  siHetzner,
  siLastpass,
  siHostinger,
  siHuggingface,
  siInstagram,
  siKeeper,
  siLemonsqueezy,
  siLinux,
  siMinutemailer,
  siNamecheap,
  siOvh,
  siOpenid,
  siPaddle,
  siPaypal,
  siPenpot,
  siPerplexity,
  siProton,
  siSketch,
  siStripe,
  siTiktok,
  siVultr,
  siYoutube,
} from 'simple-icons'

/** Maps `providers.slug` (see db/seed/providers.ts) → Simple Icons entry. */
export const PROVIDER_BRAND_ICONS: Record<string, SimpleIcon> = {
  google: siGoogle,
  github: siGithub,
  cloudflare: siCloudflare,
  namecheap: siNamecheap,
  hostinger: siHostinger,
  hetzner: siHetzner,
  digitalocean: siDigitalocean,
  vultr: siVultr,
  ovh: siOvh,
  contabo: siContabo,
  youtube: siYoutube,
  instagram: siInstagram,
  tiktok: siTiktok,
  bitwarden: siBitwarden,
  '1password': si1password,
  dashlane: siDashlane,
  keeper: siKeeper,
  lastpass: siLastpass,
  proton: siProton,
  stripe: siStripe,
  paypal: siPaypal,
  paddle: siPaddle,
  lemonsqueezy: siLemonsqueezy,
  anthropic: siAnthropic,
  cursor: siCursor,
  perplexity: siPerplexity,
  huggingface: siHuggingface,
  deepseek: siDeepseek,
  meta: siInstagram,
  figma: siFigma,
  penpot: siPenpot,
  sketch: siSketch,
  email: siMinutemailer,
  /** Legacy seed slug */
  vps: siLinux,
}

/** Asset types with a well-known product icon (when provider alone is ambiguous). */
export const ASSET_TYPE_BRAND_ICONS: Record<string, SimpleIcon> = {
  search_console: siGooglesearchconsole,
  google_ads: siGoogleads,
  youtube_channel: siYoutube,
  oauth_client: siOpenid,
  ai_service: siGooglegemini,
  payment_service: siStripe,
  design_tool: siFigma,
  password_manager: siBitwarden,
  vps: siLinux,
  server: siLinux,
  hosting_account: siHostinger,
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
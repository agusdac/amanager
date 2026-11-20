import type { ASSET_TYPE_KEYS } from '~/constants/inventory'

type AssetType = (typeof ASSET_TYPE_KEYS)[number]

export type OnboardingProviderDefault = {
  identityLabelKey: string
  assetNameKey: string
  assetType: AssetType
  roleHintKey: string
}

const FALLBACK: OnboardingProviderDefault = {
  identityLabelKey: 'onboarding.defaults.generic.identity',
  assetNameKey: 'onboarding.defaults.generic.asset',
  assetType: 'service',
  roleHintKey: 'onboarding.defaults.generic.roleHint',
}

export const ONBOARDING_PROVIDER_DEFAULTS: Record<string, OnboardingProviderDefault> = {
  github: {
    identityLabelKey: 'onboarding.defaults.github.identity',
    assetNameKey: 'onboarding.defaults.github.asset',
    assetType: 'repository',
    roleHintKey: 'onboarding.defaults.github.roleHint',
  },
  gitlab: {
    identityLabelKey: 'onboarding.defaults.gitlab.identity',
    assetNameKey: 'onboarding.defaults.gitlab.asset',
    assetType: 'repository',
    roleHintKey: 'onboarding.defaults.gitlab.roleHint',
  },
  google: {
    identityLabelKey: 'onboarding.defaults.google.identity',
    assetNameKey: 'onboarding.defaults.google.asset',
    assetType: 'service',
    roleHintKey: 'onboarding.defaults.google.roleHint',
  },
  'google-oauth': {
    identityLabelKey: 'onboarding.defaults.googleOauth.identity',
    assetNameKey: 'onboarding.defaults.googleOauth.asset',
    assetType: 'oauth_client',
    roleHintKey: 'onboarding.defaults.googleOauth.roleHint',
  },
  'google-search-console': {
    identityLabelKey: 'onboarding.defaults.googleSearch.identity',
    assetNameKey: 'onboarding.defaults.googleSearch.asset',
    assetType: 'search_console',
    roleHintKey: 'onboarding.defaults.googleSearch.roleHint',
  },
  'google-ads': {
    identityLabelKey: 'onboarding.defaults.googleAds.identity',
    assetNameKey: 'onboarding.defaults.googleAds.asset',
    assetType: 'google_ads',
    roleHintKey: 'onboarding.defaults.googleAds.roleHint',
  },
  youtube: {
    identityLabelKey: 'onboarding.defaults.youtube.identity',
    assetNameKey: 'onboarding.defaults.youtube.asset',
    assetType: 'youtube_channel',
    roleHintKey: 'onboarding.defaults.youtube.roleHint',
  },
  cloudflare: {
    identityLabelKey: 'onboarding.defaults.cloudflare.identity',
    assetNameKey: 'onboarding.defaults.cloudflare.asset',
    assetType: 'dns',
    roleHintKey: 'onboarding.defaults.cloudflare.roleHint',
  },
  namecheap: {
    identityLabelKey: 'onboarding.defaults.namecheap.identity',
    assetNameKey: 'onboarding.defaults.namecheap.asset',
    assetType: 'domain',
    roleHintKey: 'onboarding.defaults.namecheap.roleHint',
  },
  aws: {
    identityLabelKey: 'onboarding.defaults.aws.identity',
    assetNameKey: 'onboarding.defaults.aws.asset',
    assetType: 'hosting_account',
    roleHintKey: 'onboarding.defaults.aws.roleHint',
  },
  hetzner: {
    identityLabelKey: 'onboarding.defaults.hetzner.identity',
    assetNameKey: 'onboarding.defaults.hetzner.asset',
    assetType: 'vps',
    roleHintKey: 'onboarding.defaults.hetzner.roleHint',
  },
  bitwarden: {
    identityLabelKey: 'onboarding.defaults.bitwarden.identity',
    assetNameKey: 'onboarding.defaults.bitwarden.asset',
    assetType: 'password_manager',
    roleHintKey: 'onboarding.defaults.bitwarden.roleHint',
  },
  stripe: {
    identityLabelKey: 'onboarding.defaults.stripe.identity',
    assetNameKey: 'onboarding.defaults.stripe.asset',
    assetType: 'payment_service',
    roleHintKey: 'onboarding.defaults.stripe.roleHint',
  },
  vercel: {
    identityLabelKey: 'onboarding.defaults.vercel.identity',
    assetNameKey: 'onboarding.defaults.vercel.asset',
    assetType: 'hosting',
    roleHintKey: 'onboarding.defaults.vercel.roleHint',
  },
  instagram: {
    identityLabelKey: 'onboarding.defaults.instagram.identity',
    assetNameKey: 'onboarding.defaults.instagram.asset',
    assetType: 'service',
    roleHintKey: 'onboarding.defaults.instagram.roleHint',
  },
  tiktok: {
    identityLabelKey: 'onboarding.defaults.tiktok.identity',
    assetNameKey: 'onboarding.defaults.tiktok.asset',
    assetType: 'service',
    roleHintKey: 'onboarding.defaults.tiktok.roleHint',
  },
}

export function onboardingDefaultForProvider(slug: string): OnboardingProviderDefault {
  return ONBOARDING_PROVIDER_DEFAULTS[slug] ?? FALLBACK
}

export type SuggestedDependency = {
  fromSlug: string
  toSlug: string
  relationType: string
  labelKey: string
}

export function suggestOnboardingDependencies(providerSlugs: string[]): SuggestedDependency[] {
  const set = new Set(providerSlugs)
  const seen = new Set<string>()
  const out: SuggestedDependency[] = []
  const add = (from: string, to: string, relationType: string, labelKey: string) => {
    if (!set.has(from) || !set.has(to)) return
    const key = `${from}\0${to}\0${relationType}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ fromSlug: from, toSlug: to, relationType, labelKey })
  }

  add('cloudflare', 'namecheap', 'dns_managed_by', 'onboarding.suggestedDeps.dnsManaged')
  add('namecheap', 'hetzner', 'depends_on', 'onboarding.suggestedDeps.domainToServer')
  add('namecheap', 'vercel', 'depends_on', 'onboarding.suggestedDeps.domainToHosting')

  add('github', 'vercel', 'deployed_from', 'onboarding.suggestedDeps.deployedFrom')
  add('github', 'hetzner', 'deployed_from', 'onboarding.suggestedDeps.deployedToVps')
  add('github', 'digitalocean', 'deployed_from', 'onboarding.suggestedDeps.deployedToVps')
  add('github', 'aws', 'deployed_from', 'onboarding.suggestedDeps.awsDeploy')
  add('gitlab', 'vercel', 'deployed_from', 'onboarding.suggestedDeps.deployedFrom')

  add('cloudflare', 'vercel', 'hosted_on', 'onboarding.suggestedDeps.cdnInFront')
  add('cloudflare', 'hetzner', 'hosted_on', 'onboarding.suggestedDeps.cdnInFront')

  add('google-oauth', 'github', 'authenticated_by', 'onboarding.suggestedDeps.oauthLogin')
  add('vercel', 'google-oauth', 'depends_on', 'onboarding.suggestedDeps.appUsesOauth')
  add('youtube', 'google-oauth', 'depends_on', 'onboarding.suggestedDeps.youtubeOauth')

  add('google-search-console', 'namecheap', 'verified_with', 'onboarding.suggestedDeps.gscDomain')
  add('google-search-console', 'cloudflare', 'verified_with', 'onboarding.suggestedDeps.gscDns')
  add('google-ads', 'google-search-console', 'depends_on', 'onboarding.suggestedDeps.adsSearch')

  add('stripe', 'namecheap', 'billed_through', 'onboarding.suggestedDeps.billingDomain')
  add('paypal', 'namecheap', 'billed_through', 'onboarding.suggestedDeps.billingDomain')

  add('bitwarden', 'google', 'recovery_depends_on', 'onboarding.suggestedDeps.vaultRecovery')
  add('bitwarden', 'github', 'recovery_depends_on', 'onboarding.suggestedDeps.vaultRecoveryGithub')
  add('email', 'google', 'sends_email_via', 'onboarding.suggestedDeps.mailViaGoogle')

  add('instagram', 'cloudflare', 'depends_on', 'onboarding.suggestedDeps.socialSite')
  add('tiktok', 'cloudflare', 'depends_on', 'onboarding.suggestedDeps.socialSite')

  return out
}
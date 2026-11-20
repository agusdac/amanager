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
    assetType: 'oauth_client',
    roleHintKey: 'onboarding.defaults.google.roleHint',
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
  const out: SuggestedDependency[] = []
  const add = (from: string, to: string, relationType: string, labelKey: string) => {
    if (set.has(from) && set.has(to)) out.push({ fromSlug: from, toSlug: to, relationType, labelKey })
  }
  add('cloudflare', 'namecheap', 'dns_managed_by', 'onboarding.suggestedDeps.dnsManaged')
  add('github', 'vercel', 'deployed_from', 'onboarding.suggestedDeps.deployedFrom')
  add('github', 'hetzner', 'deployed_from', 'onboarding.suggestedDeps.deployedToVps')
  add('google', 'github', 'authenticated_by', 'onboarding.suggestedDeps.oauthLogin')
  add('aws', 'github', 'deployed_from', 'onboarding.suggestedDeps.awsDeploy')
  add('bitwarden', 'google', 'recovery_depends_on', 'onboarding.suggestedDeps.vaultRecovery')
  return out
}
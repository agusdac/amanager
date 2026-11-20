export const ASSET_TYPE_KEYS = [
  'service',
  'domain',
  'hosting',
  'hosting_account',
  'server',
  'repository',
  'dns',
  'email',
  'oauth_client',
  'youtube_channel',
  'search_console',
  'google_ads',
  'vps',
  'mail_hosting',
  'object_storage',
  'transactional_email',
  'payment_service',
  'ai_service',
  'password_manager',
  'design_tool',
  'other',
] as const

/** Asset types that typically have vault/config secrets — show PM deep link field. */
export const ASSET_TYPES_WITH_VAULT_HINT = [
  'oauth_client',
  'vps',
  'server',
  'hosting_account',
  'repository',
  'payment_service',
  'ai_service',
  'password_manager',
  'domain',
  'mail_hosting',
] as const

/** Console / provider panel links. */
export const ASSET_TYPES_WITH_ADMIN_URL = [
  'service',
  'domain',
  'hosting',
  'hosting_account',
  'server',
  'repository',
  'dns',
  'oauth_client',
  'youtube_channel',
  'search_console',
  'google_ads',
  'vps',
  'mail_hosting',
  'object_storage',
  'transactional_email',
  'payment_service',
  'ai_service',
  'password_manager',
  'design_tool',
  'other',
] as const

/** Customer-facing site or app URL. */
export const ASSET_TYPES_WITH_PUBLIC_URL = ['service', 'domain', 'hosting', 'repository', 'youtube_channel', 'other'] as const

export function assetTypeShowsAdminUrl(type: string) {
  return (ASSET_TYPES_WITH_ADMIN_URL as readonly string[]).includes(type)
}

export function assetTypeShowsPublicUrl(type: string) {
  return (ASSET_TYPES_WITH_PUBLIC_URL as readonly string[]).includes(type)
}

export const CONFIG_ENTRY_KEY_PRESETS = [
  'oauth_client_id',
  'redirect_uri_production',
  'redirect_uri_development',
  'javascript_origin_production',
  'javascript_origin_development',
  'custom',
] as const

export const RELATION_TYPE_KEYS = [
  'depends_on',
  'hosted_on',
  'deployed_from',
  'authenticated_by',
  'stores_data_in',
  'sends_email_via',
  'domain_registered_at',
  'dns_managed_by',
  'verified_with',
  'publishes_to',
  'billed_through',
  'recovery_depends_on',
  'other',
] as const

export const ENVIRONMENT_KINDS = ['production', 'development', 'staging', 'other'] as const

export const VERIFICATION_STATUS_KEYS = ['unverified', 'declared', 'confirmed_by_human'] as const

/** Inventory items that still need a human confirmation pass. */
export const NEEDS_CONFIRMATION_VERIFICATION_STATUSES = ['unverified', 'declared'] as const

export const VERIFICATION_METHOD_KEYS = [
  'dns_txt',
  'html_file',
  'meta_tag',
  'cname',
  'registrar_lock',
  'provider_console',
  'manual_check',
  'other',
] as const
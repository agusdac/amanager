export const ASSET_TYPE_KEYS = [
  'service',
  'domain',
  'hosting',
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
  'other',
] as const

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
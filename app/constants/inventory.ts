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
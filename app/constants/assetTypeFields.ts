import type { AssetAttributes } from '#shared/schemas/assetAttributes'

export type AssetAttributeFieldDef = {
  key: keyof AssetAttributes
  labelKey: string
  input: 'text' | 'url'
  placeholderKey?: string
  inheritFromProjectDomain?: boolean
}

/** Fields shown on asset overview per type (saved in attributes_json). */
export const ASSET_TYPE_ATTRIBUTE_FIELDS: Record<string, AssetAttributeFieldDef[]> = {
  vps: [
    { key: 'ipv4', labelKey: 'assets.attr.ipv4', input: 'text' },
    { key: 'ipv6', labelKey: 'assets.attr.ipv6', input: 'text' },
    { key: 'hostname', labelKey: 'assets.attr.hostname', input: 'text' },
    { key: 'region', labelKey: 'assets.attr.region', input: 'text' },
  ],
  server: [
    { key: 'ipv4', labelKey: 'assets.attr.ipv4', input: 'text' },
    { key: 'hostname', labelKey: 'assets.attr.hostname', input: 'text' },
    { key: 'region', labelKey: 'assets.attr.region', input: 'text' },
  ],
  hosting_account: [
    { key: 'planLabel', labelKey: 'assets.attr.planLabel', input: 'text' },
    { key: 'region', labelKey: 'assets.attr.region', input: 'text' },
  ],
  search_console: [
    {
      key: 'siteDomain',
      labelKey: 'assets.attr.siteDomain',
      input: 'text',
      inheritFromProjectDomain: true,
      placeholderKey: 'assets.attr.siteDomainPlaceholder',
    },
  ],
  domain: [
    {
      key: 'siteDomain',
      labelKey: 'assets.attr.siteDomain',
      input: 'text',
      inheritFromProjectDomain: true,
    },
  ],
  payment_service: [
    { key: 'paymentAccountId', labelKey: 'assets.attr.paymentAccountId', input: 'text' },
    { key: 'planLabel', labelKey: 'assets.attr.planLabel', input: 'text' },
  ],
  ai_service: [
    { key: 'aiModelHint', labelKey: 'assets.attr.aiModelHint', input: 'text' },
    { key: 'planLabel', labelKey: 'assets.attr.planLabel', input: 'text' },
  ],
  design_tool: [{ key: 'designTeamId', labelKey: 'assets.attr.designTeamId', input: 'text' }],
}

export const INFRASTRUCTURE_LINK_TYPES = ['vps', 'server', 'hosting_account', 'hosting'] as const

export function projectDomainFromWebsite(websiteUrl: string | null | undefined): string {
  if (!websiteUrl?.trim()) return ''
  try {
    const host = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname
    return host.replace(/^www\./, '')
  } catch {
    return websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
  }
}
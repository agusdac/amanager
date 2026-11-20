import type { RunbookGenContext } from './context'

/** Deterministic example inventory for template step preview (no project required). */
export function sampleRunbookGenContext(locale: 'en' | 'es' = 'en'): RunbookGenContext {
  return {
    project: { id: '00000000-0000-4000-8000-000000000001', name: locale === 'es' ? 'Proyecto ejemplo' : 'Example project', slug: 'example' },
    environment: { id: '00000000-0000-4000-8000-000000000002', name: 'Staging', kind: 'staging' },
    locale,
    assets: [
      {
        id: '00000000-0000-4000-8000-000000000011',
        name: 'VPS-02 (placeholder)',
        type: 'vps',
        adminUrl: null,
        publicUrl: null,
        verificationStatus: 'declared',
        providerSlug: 'contabo',
        environmentId: '00000000-0000-4000-8000-000000000002',
      },
      {
        id: '00000000-0000-4000-8000-000000000012',
        name: 'northline-api',
        type: 'repository',
        adminUrl: 'https://github.com/org/northline-api',
        publicUrl: null,
        verificationStatus: 'confirmed_by_human',
        providerSlug: 'github',
        environmentId: '00000000-0000-4000-8000-000000000002',
      },
    ],
    vaultRefs: [
      {
        id: '00000000-0000-4000-8000-000000000021',
        label: 'Staging .env bundle',
        locationHint: 'Bitwarden · Northline / staging',
        itemUrl: 'https://vault.example/items/staging-env',
      },
    ],
    configEntries: [
      { id: '1', key: 'NODE_VERSION', publicValue: '22', isSensitiveReference: false },
      { id: '2', key: 'APP_URL', publicValue: 'https://staging.example.com', isSensitiveReference: false },
    ],
    identities: [{ id: '1', label: 'Dev bootstrap', verificationStatus: 'declared' }],
    roles: [
      { assetId: '00000000-0000-4000-8000-000000000012', assetName: 'northline-api', identityLabel: 'Dev bootstrap', roleType: 'maintainer' },
    ],
    emails: [{ id: '1', address: 'dev@northline.example', label: 'Shared staging mailbox' }],
    dependencies: [
      {
        fromAssetId: '00000000-0000-4000-8000-000000000011',
        fromName: 'VPS-02',
        toAssetId: '00000000-0000-4000-8000-000000000012',
        toName: 'northline-api',
        relationType: 'hosts',
        description: 'API runs on this VPS',
      },
    ],
  }
}
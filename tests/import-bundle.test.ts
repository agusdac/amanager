import { describe, expect, it } from 'vitest'
import { parseBundleFiles, parseBundleFromCsvOnly, emptyTemplateFiles } from '../server/utils/import-bundle'
import { assetMatchKey } from '../server/utils/import-keys'
import { suggestColumnMap } from '../shared/import/column-presets'
import { detectDuplicates, normalizeAssetRows } from '../server/utils/import-duplicates'

describe('import bundle', () => {
  it('parses single assets.csv', () => {
    const csv = `project,provider,asset_type,asset_name,login_email,environment,admin_url,notes
Northline,github,repository,web repo,,production,,placeholder`
    const bundle = parseBundleFiles(parseBundleFromCsvOnly(csv))
    expect(bundle.assets.rows).toHaveLength(1)
    expect(bundle.assets.rows[0]?.asset_name).toBe('web repo')
  })

  it('template has manifest', () => {
    const files = emptyTemplateFiles()
    const bundle = parseBundleFiles(files)
    expect(bundle.manifest.formatVersion).toBe(1)
  })
})

describe('column presets', () => {
  it('suggests notion-like headers', () => {
    const map = suggestColumnMap(['Name', 'Type', 'Provider', 'login_email', 'verification_status'])
    expect(map.login_email).toBe('login_email')
    expect(map.verification_status).toBe('verification_status')
    const mapNotion = suggestColumnMap(['Name', 'Type', 'Provider'])
    expect(mapNotion.Name).toBe('asset_name')
    expect(mapNotion.Type).toBe('asset_type')
    expect(mapNotion.Provider).toBe('provider')
  })
})

describe('import duplicates', () => {
  it('matches composite key', () => {
    const rows = normalizeAssetRows(
      [
        {
          project: 'northline',
          provider: 'github',
          asset_type: 'repository',
          asset_name: 'Web Repo',
        },
      ],
      'northline',
    )
    const existing = [
      {
        id: 'a1',
        name: 'Web Repo',
        type: 'repository',
        externalIdentifier: null,
        adminUrl: null,
        publicUrl: null,
        description: null,
        verificationStatus: 'declared',
        projectId: 'p1',
        projectSlug: 'northline',
        providerSlug: 'github',
      },
    ]
    const dupes = detectDuplicates(rows, existing)
    expect(dupes).toHaveLength(1)
    expect(dupes[0]?.matchKey).toBe(
      assetMatchKey({
        projectKey: 'northline',
        providerSlug: 'github',
        assetType: 'repository',
        assetName: 'Web Repo',
      }),
    )
  })
})
import { describe, expect, it } from 'vitest'
import { normalizeAssetRows } from '../server/utils/import-duplicates'
import { buildProviderCatalogIndex } from '../server/utils/import-providers'
import { validateAssetRows } from '../server/utils/import-validate'

const catalog = buildProviderCatalogIndex([
  { id: '1', slug: 'github', name: 'GitHub' },
  { id: '2', slug: 'hetzner', name: 'Hetzner' },
])

describe('import validate', () => {
  it('warns on unknown provider but does not block', () => {
    const rows = normalizeAssetRows(
      [{ project: 'Old', provider: 'vps', asset_type: 'vps', asset_name: 'VPS-01' }],
      'new-proj',
      { mode: 'new_project', newProjectName: 'New Proj' },
    )
    expect(rows[0]?.projectKey).toBe('new-proj')
    const { errors, warnings } = validateAssetRows(rows, catalog)
    expect(errors).toHaveLength(0)
    expect(warnings.some((w) => w.message === 'unknown_provider')).toBe(true)
  })

  it('remaps project for focused import without mismatch error', () => {
    const rows = normalizeAssetRows(
      [{ project: 'Mini Críptico', provider: 'github', asset_type: 'repository', asset_name: 'repo' }],
      'northline',
      { mode: 'project', projectId: 'p1' },
    )
    expect(rows[0]?.projectKey).toBe('northline')
    const { errors } = validateAssetRows(rows, catalog)
    expect(errors).toHaveLength(0)
  })
})
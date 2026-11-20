import { describe, expect, it } from 'vitest'
import { formatAssetMarkdownLine, splitPlaceholderAssetName } from '../shared/runbooks/inventoryMarkdown'

describe('inventory markdown lines', () => {
  it('strips placeholder suffix from link label', () => {
    expect(splitPlaceholderAssetName('VPS-02 (placeholder)')).toEqual({
      displayName: 'VPS-02',
      isPlaceholder: true,
    })
  })

  it('formats asset line without ugly duplicate type', () => {
    const line = formatAssetMarkdownLine({
      id: 'a1',
      name: 'VPS-02 (placeholder)',
      type: 'vps',
      verificationStatus: 'declared',
      providerSlug: 'contabo',
    })
    expect(line).toContain('[VPS-02](/assets/a1)')
    expect(line).toContain('VPS')
    expect(line).not.toContain('(vps)')
    expect(line).not.toContain('_needs confirmation_')
    expect(line).toContain('confirm in Hilko')
    expect(line).toContain('placeholder in inventory')
  })

  it('omits notes for confirmed assets', () => {
    const line = formatAssetMarkdownLine({
      id: 'a2',
      name: 'northline-api',
      type: 'repository',
      verificationStatus: 'confirmed_by_human',
      providerSlug: 'github',
      adminUrl: 'https://github.com/org/northline-api',
    })
    expect(line).not.toContain('confirm in Hilko')
    expect(line).toContain('northline-api')
  })
})
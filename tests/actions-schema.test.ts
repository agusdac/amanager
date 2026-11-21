import { describe, expect, it } from 'vitest'
import { assertSingleAnchor } from '../server/utils/actions'
import { buildAssetInsertLines } from '../shared/actions/insertFromAsset'

describe('actions anchor', () => {
  it('rejects dual anchor', () => {
    try {
      assertSingleAnchor('a', 'p')
      expect.unreachable('should throw')
    } catch (err: unknown) {
      const error = err as { statusCode?: number }
      expect(error.statusCode).toBe(400)
    }
  })

  it('allows single or global anchor', () => {
    expect(() => assertSingleAnchor('a', null)).not.toThrow()
    expect(() => assertSingleAnchor(null, 'p')).not.toThrow()
    expect(() => assertSingleAnchor(null, null)).not.toThrow()
  })
})

describe('insert from asset', () => {
  it('builds literal lines from inventory fields', () => {
    const text = buildAssetInsertLines({
      name: 'VPS prod',
      adminUrl: 'https://panel.example/vps',
      attributesJson: { ipv4: '203.0.113.10' },
    })
    expect(text).toContain('VPS prod')
    expect(text).toContain('203.0.113.10')
    expect(text).not.toContain('{ipv4}')
  })
})
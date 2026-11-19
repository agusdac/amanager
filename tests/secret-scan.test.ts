import { describe, expect, it } from 'vitest'
import { rowHasSuspiciousSecret, scanCsvHeaders } from '../server/utils/secret-scan'

describe('secret-scan', () => {
  it('rejects forbidden column names', () => {
    const r = scanCsvHeaders(['project', 'api_key', 'asset_name'])
    expect(r.ok).toBe(false)
    expect(r.rejected).toContain('api_key')
  })

  it('flags suspicious cell values', () => {
    expect(rowHasSuspiciousSecret({ asset_name: 'x', api_key: 'sk_live_abc' })).toBe(true)
    expect(rowHasSuspiciousSecret({ asset_name: 'My VPS', notes: 'declared only' })).toBe(false)
  })
})
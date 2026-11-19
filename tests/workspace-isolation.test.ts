import { describe, expect, it } from 'vitest'
import { assertSameWorkspace } from '../server/utils/workspace'

describe('workspace isolation', () => {
  it('allows matching workspace ids', () => {
    expect(() => assertSameWorkspace('ws-a', 'ws-a')).not.toThrow()
  })

  it('denies cross-workspace access with 404', () => {
    try {
      assertSameWorkspace('ws-a', 'ws-b')
      expect.unreachable('should throw')
    } catch (err: unknown) {
      const error = err as { statusCode?: number }
      expect(error.statusCode).toBe(404)
    }
  })
})
import { describe, expect, it } from 'vitest'
import { requireWorkspaceRole, roleAtLeast } from '../server/utils/workspace-role'

describe('workspace roles', () => {
  it('ranks viewer below editor', () => {
    expect(roleAtLeast('editor', 'viewer')).toBe(true)
    expect(roleAtLeast('viewer', 'editor')).toBe(false)
  })

  it('throws 403 when insufficient', () => {
    try {
      requireWorkspaceRole(
        {
          id: 'u',
          email: 'a@b.c',
          name: 'A',
          locale: 'en',
          theme: 'light',
          workspaceId: 'w',
          workspaceRole: 'viewer',
          workspaceType: 'team',
          workspaceName: 'T',
        },
        'editor',
      )
      expect.unreachable('should throw')
    } catch (err: unknown) {
      expect((err as { statusCode?: number }).statusCode).toBe(403)
    }
  })
})
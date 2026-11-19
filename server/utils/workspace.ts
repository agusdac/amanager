import { createError } from 'h3'

export function assertSameWorkspace(sessionWorkspaceId: string, resourceWorkspaceId: string): void {
  if (sessionWorkspaceId !== resourceWorkspaceId) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
}
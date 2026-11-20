import { createError } from 'h3'
import type { SessionUser } from './session'

export const WORKSPACE_ROLES = ['viewer', 'editor', 'admin', 'owner'] as const
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]

const RANK: Record<WorkspaceRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
}

export function isWorkspaceRole(value: string): value is WorkspaceRole {
  return (WORKSPACE_ROLES as readonly string[]).includes(value)
}

export function roleAtLeast(actual: string, minimum: WorkspaceRole): boolean {
  if (!isWorkspaceRole(actual)) return false
  return RANK[actual] >= RANK[minimum]
}

export function requireWorkspaceRole(session: SessionUser, minimum: WorkspaceRole): void {
  if (!roleAtLeast(session.workspaceRole, minimum)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

/** Editor+ for inventory/runbook mutations. */
export function requireEditor(session: SessionUser): void {
  requireWorkspaceRole(session, 'editor')
}

export function requireAdmin(session: SessionUser): void {
  requireWorkspaceRole(session, 'admin')
}

export function requireOwner(session: SessionUser): void {
  requireWorkspaceRole(session, 'owner')
}
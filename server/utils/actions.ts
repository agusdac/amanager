import { createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import type { CreateActionInput, UpdateActionInput } from '../../shared/schemas/actions'
import { assets, projects } from '../../db/schema'
import type { useDb } from './db'
import { scanTextFields } from './secret-scan'

export function assertSingleAnchor(assetId?: string | null, projectId?: string | null): void {
  if (assetId && projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid anchor' })
  }
}

export function rejectActionSecrets(fields: Record<string, string | null | undefined>): void {
  const hit = scanTextFields(fields)
  if (hit) {
    throw createError({ statusCode: 400, statusMessage: 'Secret pattern rejected' })
  }
}

export async function assertActionAnchors(
  db: ReturnType<typeof useDb>,
  workspaceId: string,
  input: Pick<CreateActionInput | UpdateActionInput, 'assetId' | 'projectId'>,
): Promise<void> {
  const assetId = input.assetId ?? null
  const projectId = input.projectId ?? null
  assertSingleAnchor(assetId, projectId)

  if (assetId) {
    const [row] = await db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.workspaceId, workspaceId)))
      .limit(1)
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  if (projectId) {
    const [row] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
      .limit(1)
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
}

export function sortActions<T extends { pinned: boolean; updatedAt?: Date | string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bt - at
  })
}
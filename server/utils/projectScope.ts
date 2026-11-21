import { and, eq } from 'drizzle-orm'
import { projectAssets } from '../../db/schema'
import type { useDb } from './db'

export async function assetIdsForProject(
  db: ReturnType<typeof useDb>,
  workspaceId: string,
  projectId: string,
): Promise<string[]> {
  const links = await db
    .select({ assetId: projectAssets.assetId })
    .from(projectAssets)
    .where(and(eq(projectAssets.workspaceId, workspaceId), eq(projectAssets.projectId, projectId)))
  return links.map((l) => l.assetId)
}
import { and, eq } from 'drizzle-orm'
import { assetDependencies, assets, projectAssets, projects } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const db = useDb()
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  assertSameWorkspace(session.workspaceId, project.workspaceId)

  const linkedAssets = await db
    .select({ asset: assets })
    .from(projectAssets)
    .innerJoin(assets, eq(assets.id, projectAssets.assetId))
    .where(and(eq(projectAssets.projectId, id), eq(projectAssets.workspaceId, session.workspaceId)))

  const assetIds = linkedAssets.map((r) => r.asset.id)
  const allDeps = await db
    .select()
    .from(assetDependencies)
    .where(eq(assetDependencies.workspaceId, session.workspaceId))

  const dependencies = allDeps.filter(
    (d) => assetIds.includes(d.fromAssetId) || assetIds.includes(d.toAssetId),
  )

  return {
    project,
    assets: linkedAssets.map((row) => row.asset),
    dependencies,
  }
})
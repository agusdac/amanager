import { eq } from 'drizzle-orm'
import { assetDependencies, assets } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const projectId = getQuery(event).projectId as string | undefined
  const db = useDb()

  const deps = await db
    .select({
      dependency: assetDependencies,
      fromName: assets.name,
    })
    .from(assetDependencies)
    .innerJoin(assets, eq(assetDependencies.fromAssetId, assets.id))
    .where(eq(assetDependencies.workspaceId, session.workspaceId))

  return { dependencies: deps.map((d) => ({ ...d.dependency, fromName: d.fromName })), projectId }
})
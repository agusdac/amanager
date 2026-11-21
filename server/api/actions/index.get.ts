import { and, eq, inArray, isNull, or } from 'drizzle-orm'
import { actions, projectAssets } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { sortActions } from '../../utils/actions'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query = getQuery(event)
  const db = useDb()

  const conditions = [eq(actions.workspaceId, session.workspaceId)]
  if (typeof query.projectId === 'string') {
    const links = await db
      .select({ assetId: projectAssets.assetId })
      .from(projectAssets)
      .where(
        and(
          eq(projectAssets.workspaceId, session.workspaceId),
          eq(projectAssets.projectId, query.projectId),
        ),
      )
    const assetIds = links.map((l) => l.assetId)
    conditions.push(
      assetIds.length
        ? or(eq(actions.projectId, query.projectId), inArray(actions.assetId, assetIds))
        : eq(actions.projectId, query.projectId),
    )
  }
  if (typeof query.assetId === 'string') {
    conditions.push(eq(actions.assetId, query.assetId))
  }
  if (query.anchor === 'workspace') {
    conditions.push(isNull(actions.assetId), isNull(actions.projectId))
  }

  const rows = await db
    .select()
    .from(actions)
    .where(and(...conditions))

  return { actions: sortActions(rows) }
})
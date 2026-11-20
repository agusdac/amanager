import { and, eq } from 'drizzle-orm'
import { assets, importBatches, projectAssets } from '../../../../db/schema'
import { recordAudit } from '../../../utils/audit'
import { useDb } from '../../../utils/db'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const batchId = getRouterParam(event, 'batchId')
  if (!batchId) throw createError({ statusCode: 400, statusMessage: 'Missing batchId' })

  const db = useDb()
  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, batchId), eq(importBatches.workspaceId, session.workspaceId)))
    .limit(1)

  if (!batch) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  if (batch.status === 'reverted') throw createError({ statusCode: 400, statusMessage: 'Already reverted' })

  const toRemove = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.workspaceId, session.workspaceId), eq(assets.importBatchId, batchId)))

  for (const { id } of toRemove) {
    await db.delete(projectAssets).where(eq(projectAssets.assetId, id))
    await db.delete(assets).where(eq(assets.id, id))
  }

  await db
    .update(importBatches)
    .set({ status: 'reverted' })
    .where(eq(importBatches.id, batchId))

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'import_batch',
    entityId: batchId,
    action: 'import.revert',
    safeDiff: { assetsRemoved: toRemove.length },
  })

  return { reverted: toRemove.length }
})
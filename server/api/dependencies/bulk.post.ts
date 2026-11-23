import { and, eq, inArray } from 'drizzle-orm'
import { createDependenciesBulkSchema } from '../../../shared/schemas/inventory'
import { assetDependencies, assets } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = createDependenciesBulkSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const ws = session.workspaceId
  const assetIds = new Set<string>()
  for (const item of parsed.data.items) {
    assetIds.add(item.fromAssetId)
    assetIds.add(item.toAssetId)
  }

  const idList = [...assetIds]
  const rows = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.workspaceId, ws), inArray(assets.id, idList)))

  if (rows.length !== idList.length) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const created: { id: string }[] = []
  let skipped = 0

  for (const item of parsed.data.items) {
    if (item.fromAssetId === item.toAssetId) {
      skipped += 1
      continue
    }
    const [row] = await db
      .insert(assetDependencies)
      .values({
        workspaceId: ws,
        fromAssetId: item.fromAssetId,
        toAssetId: item.toAssetId,
        relationType: item.relationType,
        description: item.description ?? null,
      })
      .onConflictDoNothing({
        target: [
          assetDependencies.workspaceId,
          assetDependencies.fromAssetId,
          assetDependencies.toAssetId,
          assetDependencies.relationType,
        ],
      })
      .returning({ id: assetDependencies.id })
    if (row) created.push(row)
    else skipped += 1
  }

  return { created: created.length, skipped, dependencyIds: created.map((r) => r.id) }
})
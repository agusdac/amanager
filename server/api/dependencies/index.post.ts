import { and, eq } from 'drizzle-orm'
import { createDependencySchema } from '../../../shared/schemas/inventory'
import { assetDependencies, assets } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = createDependencySchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  for (const assetId of [parsed.data.fromAssetId, parsed.data.toAssetId]) {
    const [row] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.workspaceId, session.workspaceId)))
      .limit(1)
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  if (parsed.data.fromAssetId === parsed.data.toAssetId) {
    throw createError({ statusCode: 400, statusMessage: 'Self dependency not allowed' })
  }

  const [dependency] = await db
    .insert(assetDependencies)
    .values({
      workspaceId: session.workspaceId,
      fromAssetId: parsed.data.fromAssetId,
      toAssetId: parsed.data.toAssetId,
      relationType: parsed.data.relationType,
      description: parsed.data.description ?? null,
    })
    .returning()

  return { dependency }
})
import { and, eq } from 'drizzle-orm'
import { patchAssetSchema } from '../../../shared/schemas/inventory'
import { assets } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = patchAssetSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [existing] = await db.select().from(assets).where(eq(assets.id, id)).limit(1)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, existing.workspaceId)

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updates[k] = v === '' ? null : v
  }

  const [asset] = await db
    .update(assets)
    .set(updates)
    .where(and(eq(assets.id, id), eq(assets.workspaceId, session.workspaceId)))
    .returning()

  return { asset }
})
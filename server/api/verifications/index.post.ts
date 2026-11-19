import { and, eq } from 'drizzle-orm'
import { createVerificationSchema } from '../../../shared/schemas/inventory'
import { assets, verifications } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createVerificationSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, parsed.data.sourceId), eq(assets.workspaceId, session.workspaceId)))
    .limit(1)
  if (!asset) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const [row] = await db
    .insert(verifications)
    .values({
      workspaceId: session.workspaceId,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      status: parsed.data.method,
      evidenceNote: parsed.data.evidenceNote ?? null,
    })
    .returning()

  return { verification: row }
})
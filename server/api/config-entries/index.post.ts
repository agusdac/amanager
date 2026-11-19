import { and, eq } from 'drizzle-orm'
import { createConfigEntrySchema } from '../../../shared/schemas/inventory'
import { assets, configEntries, projects } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createConfigEntrySchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, parsed.data.assetId), eq(assets.workspaceId, session.workspaceId)))
    .limit(1)
  if (!asset) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  let projectId = parsed.data.projectId ?? null
  if (projectId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, session.workspaceId)))
      .limit(1)
    if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const [row] = await db
    .insert(configEntries)
    .values({
      workspaceId: session.workspaceId,
      assetId: parsed.data.assetId,
      projectId,
      key: parsed.data.key,
      description: parsed.data.description ?? null,
      valueType: parsed.data.valueType ?? 'string',
      publicValue: parsed.data.isSensitiveReference ? null : (parsed.data.publicValue ?? null),
      isSensitiveReference: parsed.data.isSensitiveReference ?? false,
    })
    .returning()

  return { configEntry: row }
})
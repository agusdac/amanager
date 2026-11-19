import { and, eq } from 'drizzle-orm'
import { createAssetFullSchema } from '../../../shared/schemas/inventory'
import { assets, projectAssets, projects } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createAssetFullSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const db = useDb()

  if (parsed.data.projectId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, parsed.data.projectId), eq(projects.workspaceId, session.workspaceId)))
      .limit(1)
    if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const [asset] = await db
    .insert(assets)
    .values({
      workspaceId: session.workspaceId,
      name: parsed.data.name,
      type: parsed.data.type,
      providerId: parsed.data.providerId ?? null,
      providerAccountId: parsed.data.providerAccountId ?? null,
      criticality: parsed.data.criticality ?? 'medium',
      adminUrl: parsed.data.adminUrl || null,
      publicUrl: parsed.data.publicUrl || null,
      description: parsed.data.description ?? null,
      externalIdentifier: parsed.data.externalIdentifier ?? null,
      verificationStatus: parsed.data.verificationStatus ?? 'declared',
    })
    .returning()

  if (parsed.data.projectId) {
    await db.insert(projectAssets).values({
      workspaceId: session.workspaceId,
      projectId: parsed.data.projectId,
      assetId: asset.id,
      environmentId: parsed.data.environmentId ?? null,
    })
  }

  return { asset }
})
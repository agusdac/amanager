import { and, eq } from 'drizzle-orm'
import { projectAssets, projectEnvironments, projects } from '../../../db/schema'
import { updateProjectAssetEnvironmentSchema } from '../../../shared/schemas/inventory'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { assertSameWorkspace } from '../../utils/workspace'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = updateProjectAssetEnvironmentSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const { projectId, assetId, environmentId } = parsed.data

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  assertSameWorkspace(session.workspaceId, project.workspaceId)

  if (environmentId) {
    const [env] = await db
      .select()
      .from(projectEnvironments)
      .where(
        and(
          eq(projectEnvironments.id, environmentId),
          eq(projectEnvironments.projectId, projectId),
          eq(projectEnvironments.workspaceId, session.workspaceId),
        ),
      )
      .limit(1)
    if (!env) throw createError({ statusCode: 400, statusMessage: 'Invalid environment for project' })
  }

  const [link] = await db
    .update(projectAssets)
    .set({ environmentId })
    .where(
      and(
        eq(projectAssets.workspaceId, session.workspaceId),
        eq(projectAssets.projectId, projectId),
        eq(projectAssets.assetId, assetId),
      ),
    )
    .returning()

  if (!link) throw createError({ statusCode: 404, statusMessage: 'Asset not linked to project' })

  return { link }
})
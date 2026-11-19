import { and, eq } from 'drizzle-orm'
import { createEnvironmentSchema } from '../../../shared/schemas/inventory'
import { projectEnvironments, projects } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createEnvironmentSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, parsed.data.projectId), eq(projects.workspaceId, session.workspaceId)))
    .limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const [env] = await db
    .insert(projectEnvironments)
    .values({
      workspaceId: session.workspaceId,
      projectId: project.id,
      name: parsed.data.name,
      kind: parsed.data.kind,
    })
    .returning()

  return { environment: env }
})
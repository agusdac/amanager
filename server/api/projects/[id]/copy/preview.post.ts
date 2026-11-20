import { and, eq } from 'drizzle-orm'
import { projects, workspaces } from '../../../../../db/schema'
import { projectCopyPreviewSchema } from '#shared/schemas/project-copy'
import { useDb } from '../../../../utils/db'
import { buildProjectCopyPreview } from '../../../../utils/project-copy'
import { requireSession } from '../../../../utils/session'
import { assertWorkspaceMember } from '../../../../utils/workspace-membership'
import { requireEditor } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const projectId = getRouterParam(event, 'id')
  if (!projectId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = projectCopyPreviewSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)

  const db = useDb()
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  const personalMember = await assertWorkspaceMember(db, session.id, project.workspaceId)
  if (!personalMember) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const [sourceWs] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, project.workspaceId))
    .limit(1)
  if (sourceWs?.type !== 'personal') {
    throw createError({ statusCode: 400, statusMessage: 'Copy only from personal workspace' })
  }

  const member = await assertWorkspaceMember(db, session.id, parsed.data.targetWorkspaceId)
  if (!member) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  const [targetWs] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, parsed.data.targetWorkspaceId))
    .limit(1)
  if (targetWs?.type !== 'team') {
    throw createError({ statusCode: 400, statusMessage: 'Target must be team workspace' })
  }

  const { rows, summary } = await buildProjectCopyPreview(db, projectId, project.workspaceId)

  return {
    projectId,
    targetWorkspaceId: parsed.data.targetWorkspaceId,
    rows,
    summary,
  }
})
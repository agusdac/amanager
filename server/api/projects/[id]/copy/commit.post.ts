import { and, eq } from 'drizzle-orm'
import { projects, workspaces } from '../../../../../db/schema'
import { projectCopyCommitSchema } from '#shared/schemas/project-copy'
import { recordAudit } from '../../../../utils/audit'
import { useDb } from '../../../../utils/db'
import { commitProjectCopy } from '../../../../utils/project-copy'
import { requireSession } from '../../../../utils/session'
import { assertWorkspaceMember } from '../../../../utils/workspace-membership'
import { requireAdmin } from '../../../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const projectId = getRouterParam(event, 'id')
  if (!projectId) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = await readBody(event)
  const parsed = projectCopyCommitSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)

  const db = useDb()
  const member = await assertWorkspaceMember(db, session.id, parsed.data.targetWorkspaceId)
  if (!member) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  requireAdmin({ ...session, workspaceId: parsed.data.targetWorkspaceId, workspaceRole: member.role })

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

  const result = await commitProjectCopy(db, {
    sourceProjectId: projectId,
    sourceWorkspaceId: project.workspaceId,
    targetWorkspaceId: parsed.data.targetWorkspaceId,
    actorUserId: session.id,
    selectedRowIds: parsed.data.selectedRowIds,
    confirmFlagged: parsed.data.confirmFlagged === true,
  })

  await recordAudit(db, { workspaceId: parsed.data.targetWorkspaceId, userId: session.id }, {
    entityType: 'project',
    entityId: result.projectId,
    action: 'project.copy',
    safeDiff: {
      sourceProjectId: projectId,
      sourceWorkspaceId: project.workspaceId,
      rowCount: parsed.data.selectedRowIds.length,
    },
  })

  return { projectId: result.projectId }
})
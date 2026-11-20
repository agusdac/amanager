import { createTeamWorkspaceSchema } from '#shared/schemas/workspaces'
import { workspaceMembers, workspaces } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = createTeamWorkspaceSchema.safeParse(body)
  if (!parsed.success) throw invalidInputError(parsed.error)

  const db = useDb()

  const [workspace] = await db
    .insert(workspaces)
    .values({
      type: 'team',
      name: parsed.data.name.trim(),
      ownerUserId: session.id,
    })
    .returning()

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: session.id,
    role: 'owner',
  })

  await recordAudit(db, session, {
    entityType: 'workspace',
    entityId: workspace.id,
    action: 'workspace.create',
    safeDiff: { name: workspace.name, type: 'team' },
  })

  return { workspace: { id: workspace.id, name: workspace.name, type: workspace.type } }
})
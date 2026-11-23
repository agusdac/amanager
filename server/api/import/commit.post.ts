import { importCommitBodySchema, legacyCsvImportSchema } from '../../../shared/schemas/import'
import { executeImportCommit } from '../../utils/import-commit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)

  const modern = importCommitBodySchema.safeParse(body)
  if (modern.success) {
    const db = useDb()
    return executeImportCommit(
      db,
      { workspaceId: session.workspaceId, id: session.id },
      modern.data.previewId,
      modern.data.resolutions,
    )
  }

  const legacy = legacyCsvImportSchema.safeParse(body)
  if (legacy.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Legacy commit requires previewId — run preview first',
    })
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
})
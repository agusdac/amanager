import { createVaultRefSchema } from '../../../shared/schemas/inventory'
import { vaultReferences } from '../../../db/schema'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = createVaultRefSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [ref] = await db
    .insert(vaultReferences)
    .values({
      workspaceId: session.workspaceId,
      label: parsed.data.label,
      locationHint: parsed.data.locationHint,
      vaultProvider: parsed.data.vaultProvider ?? 'bitwarden',
      assetId: parsed.data.assetId ?? null,
      projectId: parsed.data.projectId ?? null,
      itemUrl: parsed.data.itemUrl?.trim() || null,
      notes: parsed.data.notes ?? null,
    })
    .returning()

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'vault_reference',
    entityId: ref.id,
    action: 'vault_reference.create',
    safeDiff: { label: ref.label, assetId: ref.assetId, projectId: ref.projectId },
  })

  return { vaultReference: ref }
})
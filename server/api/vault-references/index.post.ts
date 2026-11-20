import { createVaultRefSchema } from '../../../shared/schemas/inventory'
import { vaultReferences } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
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

  return { vaultReference: ref }
})
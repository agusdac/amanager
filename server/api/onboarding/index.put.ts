import { onboardingDraftSchema } from '../../../shared/schemas/inventory'
import { onboardingDrafts } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody(event)
  const parsed = onboardingDraftSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const [draft] = await db
    .insert(onboardingDrafts)
    .values({
      workspaceId: session.workspaceId,
      step: parsed.data.step,
      payloadJson: parsed.data.payload,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: onboardingDrafts.workspaceId,
      set: {
        step: parsed.data.step,
        payloadJson: parsed.data.payload,
        updatedAt: new Date(),
      },
    })
    .returning()

  return { draft }
})
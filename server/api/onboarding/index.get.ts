import { eq } from 'drizzle-orm'
import { onboardingDrafts } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const [draft] = await db
    .select()
    .from(onboardingDrafts)
    .where(eq(onboardingDrafts.workspaceId, session.workspaceId))
    .limit(1)

  if (!draft || draft.completedAt) return { draft: null }
  return {
    draft: {
      step: draft.step,
      payload: draft.payloadJson,
      updatedAt: draft.updatedAt,
    },
  }
})
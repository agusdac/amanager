import { and, count, eq, inArray } from 'drizzle-orm'
import { assets, assetDependencies, identities, onboardingDrafts, projects } from '../../db/schema'
import { useDb } from '../utils/db'
import { requireSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const ws = session.workspaceId

  const [[{ projectCount }], [{ assetCount }], [{ identityCount }], [{ depCount }]] = await Promise.all([
    db.select({ projectCount: count() }).from(projects).where(eq(projects.workspaceId, ws)),
    db.select({ assetCount: count() }).from(assets).where(eq(assets.workspaceId, ws)),
    db.select({ identityCount: count() }).from(identities).where(eq(identities.workspaceId, ws)),
    db.select({ depCount: count() }).from(assetDependencies).where(eq(assetDependencies.workspaceId, ws)),
  ])

  const unverified = await db
    .select({ count: count() })
    .from(assets)
    .where(
      and(
        eq(assets.workspaceId, ws),
        inArray(assets.verificationStatus, ['unverified', 'declared']),
      ),
    )

  const [draft] = await db
    .select()
    .from(onboardingDrafts)
    .where(eq(onboardingDrafts.workspaceId, ws))
    .limit(1)

  return {
    counts: {
      projects: projectCount,
      assets: assetCount,
      identities: identityCount,
      dependencies: depCount,
      unverifiedAssets: unverified[0]?.count ?? 0,
    },
    onboarding: draft && !draft.completedAt ? { step: draft.step, updatedAt: draft.updatedAt } : null,
  }
})
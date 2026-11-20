import { and, asc, count, eq, inArray } from 'drizzle-orm'
import {
  assets,
  assetDependencies,
  emailAddresses,
  identities,
  onboardingDrafts,
  projects,
  runbookExecutions,
  runbooks,
} from '../../db/schema'
import { useDb } from '../utils/db'
import { requireSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const ws = session.workspaceId

  const [
    [{ projectCount }],
    [{ assetCount }],
    [{ emailCount }],
    [{ identityCount }],
    [{ depCount }],
    [{ runbookCount }],
    [{ activeExecutionCount }],
  ] = await Promise.all([
    db.select({ projectCount: count() }).from(projects).where(eq(projects.workspaceId, ws)),
    db.select({ assetCount: count() }).from(assets).where(eq(assets.workspaceId, ws)),
    db.select({ emailCount: count() }).from(emailAddresses).where(eq(emailAddresses.workspaceId, ws)),
    db.select({ identityCount: count() }).from(identities).where(eq(identities.workspaceId, ws)),
    db.select({ depCount: count() }).from(assetDependencies).where(eq(assetDependencies.workspaceId, ws)),
    db.select({ runbookCount: count() }).from(runbooks).where(eq(runbooks.workspaceId, ws)),
    db
      .select({ activeExecutionCount: count() })
      .from(runbookExecutions)
      .where(and(eq(runbookExecutions.workspaceId, ws), eq(runbookExecutions.status, 'in_progress'))),
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

  const attentionAssets = await db
    .select({ id: assets.id, name: assets.name, type: assets.type, verificationStatus: assets.verificationStatus })
    .from(assets)
    .where(
      and(eq(assets.workspaceId, ws), inArray(assets.verificationStatus, ['unverified', 'declared'])),
    )
    .orderBy(asc(assets.verificationStatus), asc(assets.name))
    .limit(8)

  const [draft] = await db
    .select()
    .from(onboardingDrafts)
    .where(eq(onboardingDrafts.workspaceId, ws))
    .limit(1)

  return {
    counts: {
      projects: projectCount,
      assets: assetCount,
      emails: emailCount,
      identities: identityCount,
      dependencies: depCount,
      runbooks: runbookCount,
      activeExecutions: activeExecutionCount,
      unverifiedAssets: unverified[0]?.count ?? 0,
    },
    onboarding: draft && !draft.completedAt ? { step: draft.step, updatedAt: draft.updatedAt } : null,
    attentionAssets,
  }
})
import { and, count, eq, inArray, sql } from 'drizzle-orm'
import {
  assetDependencies,
  assetEmails,
  assets,
  emailAddresses,
  identities,
  identityEmails,
  onboardingDrafts,
  projects,
  runbookExecutions,
  runbooks,
} from '../../db/schema'
import { useDb } from '../utils/db'
import { assetIdsForProject } from '../utils/projectScope'
import { requireSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()
  const ws = session.workspaceId
  const projectId = typeof getQuery(event).projectId === 'string' ? getQuery(event).projectId : undefined

  let scopedAssetIds: string[] | undefined
  if (projectId) {
    scopedAssetIds = await assetIdsForProject(db, ws, projectId)
  }

  const assetInScope = scopedAssetIds
    ? scopedAssetIds.length
      ? inArray(assets.id, scopedAssetIds)
      : sql`false`
    : undefined

  const projectCountPromise = projectId
    ? Promise.resolve([{ projectCount: 1 }])
    : db.select({ projectCount: count() }).from(projects).where(eq(projects.workspaceId, ws))

  const assetCountPromise = scopedAssetIds
    ? scopedAssetIds.length
      ? db
          .select({ assetCount: count() })
          .from(assets)
          .where(and(eq(assets.workspaceId, ws), assetInScope!))
      : Promise.resolve([{ assetCount: 0 }])
    : db.select({ assetCount: count() }).from(assets).where(eq(assets.workspaceId, ws))

  const emailCountPromise =
    scopedAssetIds && scopedAssetIds.length
      ? db
          .select({ emailCount: sql<number>`count(distinct ${assetEmails.emailId})::int` })
          .from(assetEmails)
          .where(and(eq(assetEmails.workspaceId, ws), inArray(assetEmails.assetId, scopedAssetIds)))
      : scopedAssetIds
        ? Promise.resolve([{ emailCount: 0 }])
        : db.select({ emailCount: count() }).from(emailAddresses).where(eq(emailAddresses.workspaceId, ws))

  const identityCountPromise =
    scopedAssetIds && scopedAssetIds.length
      ? db
          .select({ identityCount: sql<number>`count(distinct ${identityEmails.identityId})::int` })
          .from(identityEmails)
          .innerJoin(assetEmails, eq(assetEmails.emailId, identityEmails.emailId))
          .where(
            and(
              eq(identityEmails.workspaceId, ws),
              eq(assetEmails.workspaceId, ws),
              inArray(assetEmails.assetId, scopedAssetIds),
            ),
          )
      : scopedAssetIds
        ? Promise.resolve([{ identityCount: 0 }])
        : db.select({ identityCount: count() }).from(identities).where(eq(identities.workspaceId, ws))

  const depCountPromise =
    scopedAssetIds && scopedAssetIds.length
      ? db
          .select({ depCount: count() })
          .from(assetDependencies)
          .where(
            and(
              eq(assetDependencies.workspaceId, ws),
              inArray(assetDependencies.fromAssetId, scopedAssetIds),
              inArray(assetDependencies.toAssetId, scopedAssetIds),
            ),
          )
      : scopedAssetIds
        ? Promise.resolve([{ depCount: 0 }])
        : db.select({ depCount: count() }).from(assetDependencies).where(eq(assetDependencies.workspaceId, ws))

  const runbookConditions = [eq(runbooks.workspaceId, ws)]
  if (projectId) runbookConditions.push(eq(runbooks.projectId, projectId))

  const runbookCountPromise = db
    .select({ runbookCount: count() })
    .from(runbooks)
    .where(and(...runbookConditions))

  const executionConditions = [
    eq(runbookExecutions.workspaceId, ws),
    eq(runbookExecutions.status, 'in_progress'),
  ]
  if (projectId) {
    executionConditions.push(eq(runbooks.projectId, projectId))
  }

  const activeExecutionCountPromise = projectId
    ? db
        .select({ activeExecutionCount: count() })
        .from(runbookExecutions)
        .innerJoin(runbooks, eq(runbooks.id, runbookExecutions.runbookId))
        .where(and(...executionConditions))
    : db
        .select({ activeExecutionCount: count() })
        .from(runbookExecutions)
        .where(and(eq(runbookExecutions.workspaceId, ws), eq(runbookExecutions.status, 'in_progress')))

  const unverifiedWhere = and(
    eq(assets.workspaceId, ws),
    inArray(assets.verificationStatus, ['unverified', 'declared']),
    ...(assetInScope ? [assetInScope] : []),
  )

  const emailLinkWhere = and(
    eq(assetEmails.workspaceId, ws),
    ...(scopedAssetIds
      ? scopedAssetIds.length
        ? [inArray(assetEmails.assetId, scopedAssetIds)]
        : [sql`false`]
      : []),
  )

  const emailAssetLinkCountPromise = db
    .select({ linkCount: count() })
    .from(assetEmails)
    .where(emailLinkWhere)

  const [
    [{ projectCount }],
    [{ assetCount }],
    [{ emailCount }],
    [{ identityCount }],
    [{ depCount }],
    [{ runbookCount }],
    [{ activeExecutionCount }],
    [{ linkCount: emailAssetLinkCount }],
  ] = await Promise.all([
    projectCountPromise,
    assetCountPromise,
    emailCountPromise,
    identityCountPromise,
    depCountPromise,
    runbookCountPromise,
    activeExecutionCountPromise,
    emailAssetLinkCountPromise,
  ])

  const unverified = await db.select({ count: count() }).from(assets).where(unverifiedWhere)

  let soleActiveExecution: { executionId: string; runbookId: string } | null = null
  if (activeExecutionCount === 1) {
    const execQuery = projectId
      ? db
          .select({
            executionId: runbookExecutions.id,
            runbookId: runbookExecutions.runbookId,
          })
          .from(runbookExecutions)
          .innerJoin(runbooks, eq(runbooks.id, runbookExecutions.runbookId))
          .where(and(...executionConditions))
          .limit(1)
      : db
          .select({
            executionId: runbookExecutions.id,
            runbookId: runbookExecutions.runbookId,
          })
          .from(runbookExecutions)
          .where(and(eq(runbookExecutions.workspaceId, ws), eq(runbookExecutions.status, 'in_progress')))
          .limit(1)
    const [row] = await execQuery
    if (row) soleActiveExecution = row
  }

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
      emailAssetLinks: emailAssetLinkCount,
    },
    onboarding: draft && !draft.completedAt ? { step: draft.step, updatedAt: draft.updatedAt } : null,
    soleActiveExecution,
    scopedProjectId: projectId ?? null,
  }
})
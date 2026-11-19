import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { assets, projectAssets, providers } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)))
  const offset = (page - 1) * limit
  const search = (query.q as string | undefined)?.trim()
  const providerId = query.providerId as string | undefined
  const projectId = query.projectId as string | undefined

  const db = useDb()
  let assetIds: string[] | undefined

  if (projectId) {
    const links = await db
      .select({ assetId: projectAssets.assetId })
      .from(projectAssets)
      .where(and(eq(projectAssets.workspaceId, session.workspaceId), eq(projectAssets.projectId, projectId)))
    assetIds = links.map((l) => l.assetId)
    if (assetIds.length === 0) {
      return { assets: [], page, limit, total: 0 }
    }
  }

  const filters = [eq(assets.workspaceId, session.workspaceId)]
  if (providerId) filters.push(eq(assets.providerId, providerId))
  if (assetIds) filters.push(inArray(assets.id, assetIds))
  if (search) {
    filters.push(
      or(
        ilike(assets.name, `%${search}%`),
        ilike(assets.type, `%${search}%`),
        ilike(assets.description, `%${search}%`),
        ilike(assets.externalIdentifier, `%${search}%`),
      )!,
    )
  }

  const where = and(...filters)

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(assets)
    .where(where)

  const list = await db
    .select({
      asset: assets,
      providerName: providers.name,
    })
    .from(assets)
    .leftJoin(providers, eq(assets.providerId, providers.id))
    .where(where)
    .orderBy(desc(assets.updatedAt))
    .limit(limit)
    .offset(offset)

  return {
    assets: list.map((r) => ({ ...r.asset, providerName: r.providerName })),
    page,
    limit,
    total,
  }
})
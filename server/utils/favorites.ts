import { createError } from 'h3'
import { and, asc, eq, inArray } from 'drizzle-orm'
import {
  actions,
  assets,
  emailAddresses,
  identities,
  projectAssets,
  workspaceFavorites,
} from '../../db/schema'
import type { FavoriteTargetType } from '../../shared/schemas/actions'
import type { useDb } from './db'

export type ResolvedFavorite = {
  id: string
  targetType: FavoriteTargetType
  targetId: string
  position: number
  label: string
  subtitle: string | null
  href: string
  projectId: string | null
  actionKind: string | null
  assetType: string | null
  linkedAssetId: string | null
  linkedAssetHref: string | null
}

async function primaryProjectForAsset(
  db: ReturnType<typeof useDb>,
  workspaceId: string,
  assetId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ projectId: projectAssets.projectId })
    .from(projectAssets)
    .where(and(eq(projectAssets.workspaceId, workspaceId), eq(projectAssets.assetId, assetId)))
    .limit(1)
  return row?.projectId ?? null
}

export async function resolveFavorites(
  db: ReturnType<typeof useDb>,
  workspaceId: string,
  userId: string,
): Promise<ResolvedFavorite[]> {
  const rows = await db
    .select()
    .from(workspaceFavorites)
    .where(and(eq(workspaceFavorites.workspaceId, workspaceId), eq(workspaceFavorites.userId, userId)))
    .orderBy(asc(workspaceFavorites.position))

  if (!rows.length) return []

  const byType = (type: FavoriteTargetType) =>
    rows.filter((r) => r.targetType === type).map((r) => r.targetId)

  const assetIds = byType('asset')
  const identityIds = byType('identity')
  const emailIds = byType('email_address')
  const actionIds = byType('action')

  const [assetRows, identityRows, emailRows, actionRows] = await Promise.all([
    assetIds.length
      ? db
          .select({ id: assets.id, name: assets.name, type: assets.type })
          .from(assets)
          .where(and(eq(assets.workspaceId, workspaceId), inArray(assets.id, assetIds)))
      : Promise.resolve([]),
    identityIds.length
      ? db
          .select({ id: identities.id, label: identities.label })
          .from(identities)
          .where(and(eq(identities.workspaceId, workspaceId), inArray(identities.id, identityIds)))
      : Promise.resolve([]),
    emailIds.length
      ? db
          .select({ id: emailAddresses.id, address: emailAddresses.address })
          .from(emailAddresses)
          .where(and(eq(emailAddresses.workspaceId, workspaceId), inArray(emailAddresses.id, emailIds)))
      : Promise.resolve([]),
    actionIds.length
      ? db
          .select({
            id: actions.id,
            title: actions.title,
            assetId: actions.assetId,
            projectId: actions.projectId,
            kind: actions.kind,
          })
          .from(actions)
          .where(and(eq(actions.workspaceId, workspaceId), inArray(actions.id, actionIds)))
      : Promise.resolve([]),
  ])

  const assetMap = new Map(assetRows.map((a) => [a.id, a]))

  const actionAnchorAssetIds = [
    ...new Set(actionRows.map((a) => a.assetId).filter((id): id is string => Boolean(id))),
  ].filter((id) => !assetMap.has(id))
  if (actionAnchorAssetIds.length) {
    const extraAssets = await db
      .select({ id: assets.id, name: assets.name, type: assets.type })
      .from(assets)
      .where(and(eq(assets.workspaceId, workspaceId), inArray(assets.id, actionAnchorAssetIds)))
    for (const a of extraAssets) assetMap.set(a.id, a)
  }
  const identityMap = new Map(identityRows.map((i) => [i.id, i]))
  const emailMap = new Map(emailRows.map((e) => [e.id, e]))
  const actionMap = new Map(actionRows.map((a) => [a.id, a]))

  const projectCache = new Map<string, string | null>()
  async function projectForAsset(assetId: string): Promise<string | null> {
    if (projectCache.has(assetId)) return projectCache.get(assetId) ?? null
    const pid = await primaryProjectForAsset(db, workspaceId, assetId)
    projectCache.set(assetId, pid)
    return pid
  }

  const resolved: ResolvedFavorite[] = []
  for (const row of rows) {
    const type = row.targetType as FavoriteTargetType
    if (type === 'asset') {
      const a = assetMap.get(row.targetId)
      if (!a) continue
      const projectId = await projectForAsset(a.id)
      resolved.push({
        id: row.id,
        targetType: type,
        targetId: row.targetId,
        position: row.position,
        label: a.name,
        subtitle: null,
        href: `/assets/${a.id}`,
        projectId,
        actionKind: null,
        assetType: a.type,
        linkedAssetId: a.id,
        linkedAssetHref: `/assets/${a.id}`,
      })
      continue
    }
    if (type === 'identity') {
      const i = identityMap.get(row.targetId)
      if (!i) continue
      resolved.push({
        id: row.id,
        targetType: type,
        targetId: row.targetId,
        position: row.position,
        label: i.label,
        subtitle: null,
        href: '/accounts?tab=identities',
        projectId: null,
        actionKind: null,
        assetType: null,
        linkedAssetId: null,
        linkedAssetHref: null,
      })
      continue
    }
    if (type === 'email_address') {
      const e = emailMap.get(row.targetId)
      if (!e) continue
      resolved.push({
        id: row.id,
        targetType: type,
        targetId: row.targetId,
        position: row.position,
        label: e.address,
        subtitle: null,
        href: '/accounts?tab=emails',
        projectId: null,
        actionKind: null,
        assetType: null,
        linkedAssetId: null,
        linkedAssetHref: null,
      })
      continue
    }
    if (type === 'action') {
      const act = actionMap.get(row.targetId)
      if (!act) continue
      const href = `/actions/${act.id}`
      let projectId = act.projectId
      let subtitle: string | null = null
      let linkedAssetId: string | null = null
      let linkedAssetHref: string | null = null
      if (act.assetId) {
        const linked = assetMap.get(act.assetId)
        if (linked) subtitle = linked.name
        linkedAssetId = act.assetId
        linkedAssetHref = `/assets/${act.assetId}`
        if (!projectId) projectId = await projectForAsset(act.assetId)
      }
      resolved.push({
        id: row.id,
        targetType: type,
        targetId: row.targetId,
        position: row.position,
        label: act.title,
        subtitle,
        href,
        projectId,
        actionKind: act.kind,
        assetType: null,
        linkedAssetId,
        linkedAssetHref,
      })
    }
  }

  return resolved
}

export async function assertFavoriteTarget(
  db: ReturnType<typeof useDb>,
  workspaceId: string,
  targetType: FavoriteTargetType,
  targetId: string,
): Promise<void> {
  let found = false
  if (targetType === 'asset') {
    const [row] = await db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.id, targetId), eq(assets.workspaceId, workspaceId)))
      .limit(1)
    found = Boolean(row)
  } else if (targetType === 'identity') {
    const [row] = await db
      .select({ id: identities.id })
      .from(identities)
      .where(and(eq(identities.id, targetId), eq(identities.workspaceId, workspaceId)))
      .limit(1)
    found = Boolean(row)
  } else if (targetType === 'email_address') {
    const [row] = await db
      .select({ id: emailAddresses.id })
      .from(emailAddresses)
      .where(and(eq(emailAddresses.id, targetId), eq(emailAddresses.workspaceId, workspaceId)))
      .limit(1)
    found = Boolean(row)
  } else if (targetType === 'action') {
    const [row] = await db
      .select({ id: actions.id })
      .from(actions)
      .where(and(eq(actions.id, targetId), eq(actions.workspaceId, workspaceId)))
      .limit(1)
    found = Boolean(row)
  }
  if (!found) throw createError({ statusCode: 400, statusMessage: 'Invalid favorite target' })
}
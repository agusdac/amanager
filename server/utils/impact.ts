import { and, eq, inArray } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { assetDependencies, assetRoles, assets } from '../../db/schema'
import type * as schema from '../../db/schema'

const MAX_DEPTH = 8

export type ImpactEdge = {
  fromAssetId: string
  toAssetId: string
  fromName: string
  toName: string
  relationType: string
  verificationStatus: string
  depth: number
  direction: 'outbound' | 'inbound'
}

export async function computeAssetImpact(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  rootAssetId: string,
): Promise<ImpactEdge[]> {
  const allDeps = await db
    .select()
    .from(assetDependencies)
    .where(eq(assetDependencies.workspaceId, workspaceId))

  const assetIds = new Set<string>()
  for (const d of allDeps) {
    assetIds.add(d.fromAssetId)
    assetIds.add(d.toAssetId)
  }
  assetIds.add(rootAssetId)

  const assetRows =
    assetIds.size > 0
      ? await db
          .select({ id: assets.id, name: assets.name })
          .from(assets)
          .where(and(eq(assets.workspaceId, workspaceId), inArray(assets.id, [...assetIds])))
      : []

  const names = new Map(assetRows.map((a) => [a.id, a.name]))

  const outbound = new Map<string, typeof allDeps>()
  const inbound = new Map<string, typeof allDeps>()
  for (const d of allDeps) {
    if (!outbound.has(d.fromAssetId)) outbound.set(d.fromAssetId, [])
    outbound.get(d.fromAssetId)!.push(d)
    if (!inbound.has(d.toAssetId)) inbound.set(d.toAssetId, [])
    inbound.get(d.toAssetId)!.push(d)
  }

  const edges: ImpactEdge[] = []
  const visited = new Set<string>()

  type Q = { assetId: string; depth: number }
  const queue: Q[] = [{ assetId: rootAssetId, depth: 0 }]
  visited.add(rootAssetId)

  while (queue.length > 0) {
    const { assetId, depth } = queue.shift()!
    if (depth >= MAX_DEPTH) continue

    for (const d of outbound.get(assetId) ?? []) {
      edges.push({
        fromAssetId: d.fromAssetId,
        toAssetId: d.toAssetId,
        fromName: names.get(d.fromAssetId) ?? d.fromAssetId,
        toName: names.get(d.toAssetId) ?? d.toAssetId,
        relationType: d.relationType,
        verificationStatus: d.verificationStatus,
        depth: depth + 1,
        direction: 'outbound',
      })
      if (!visited.has(d.toAssetId)) {
        visited.add(d.toAssetId)
        queue.push({ assetId: d.toAssetId, depth: depth + 1 })
      }
    }
    for (const d of inbound.get(assetId) ?? []) {
      edges.push({
        fromAssetId: d.fromAssetId,
        toAssetId: d.toAssetId,
        fromName: names.get(d.fromAssetId) ?? d.fromAssetId,
        toName: names.get(d.toAssetId) ?? d.toAssetId,
        relationType: d.relationType,
        verificationStatus: d.verificationStatus,
        depth: depth + 1,
        direction: 'inbound',
      })
      if (!visited.has(d.fromAssetId)) {
        visited.add(d.fromAssetId)
        queue.push({ assetId: d.fromAssetId, depth: depth + 1 })
      }
    }
  }

  return edges
}

export async function computeIdentityImpact(
  db: NodePgDatabase<typeof schema>,
  workspaceId: string,
  identityId: string,
): Promise<{ assets: { id: string; name: string }[]; edges: ImpactEdge[] }> {
  const roles = await db
    .select({ assetId: assetRoles.assetId })
    .from(assetRoles)
    .where(and(eq(assetRoles.workspaceId, workspaceId), eq(assetRoles.identityId, identityId)))

  const roleIds = roles.map((r) => r.assetId)
  if (roleIds.length === 0) {
    return { assets: [], edges: [] }
  }
  const assetList = await db
    .select({ id: assets.id, name: assets.name })
    .from(assets)
    .where(and(eq(assets.workspaceId, workspaceId), inArray(assets.id, roleIds)))

  const allEdges: ImpactEdge[] = []
  for (const role of roles) {
    const edges = await computeAssetImpact(db, workspaceId, role.assetId)
    allEdges.push(...edges)
  }

  return { assets: assetList, edges: allEdges }
}
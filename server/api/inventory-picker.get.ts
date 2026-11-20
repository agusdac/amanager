import { and, eq, ilike, or } from 'drizzle-orm'
import { assets, configEntries, emailAddresses, identities, providers, vaultReferences } from '../../db/schema'
import type { InventoryTargetType } from '../../shared/runbooks/inventoryTargets'
import { useDb } from '../utils/db'
import { requireSession } from '../utils/session'

const LIMIT = 12

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query = getQuery(event)
  const q = String(query.q ?? '')
    .trim()
    .slice(0, 200)
  const type = String(query.type ?? 'asset') as InventoryTargetType
  const projectId = typeof query.projectId === 'string' ? query.projectId : undefined

  const db = useDb()
  const ws = session.workspaceId

  if (q.length < 1) {
    return { results: [] as Array<{ id: string; label: string; sublabel?: string | null }> }
  }

  const pattern = `%${q}%`

  if (type === 'asset') {
    const rows = await db
      .select({
        id: assets.id,
        name: assets.name,
        type: assets.type,
        providerSlug: providers.slug,
      })
      .from(assets)
      .leftJoin(providers, eq(providers.id, assets.providerId))
      .where(
        and(
          eq(assets.workspaceId, ws),
          or(ilike(assets.name, pattern), ilike(assets.type, pattern), ilike(assets.description, pattern))!,
        ),
      )
      .limit(LIMIT)
    return {
      results: rows.map((r) => ({
        id: r.id,
        label: r.name,
        sublabel: [r.type, r.providerSlug].filter(Boolean).join(' · '),
      })),
    }
  }

  if (type === 'identity') {
    const rows = await db
      .select({ id: identities.id, label: identities.label, providerName: providers.name })
      .from(identities)
      .leftJoin(providers, eq(providers.id, identities.providerId))
      .where(and(eq(identities.workspaceId, ws), ilike(identities.label, pattern)))
      .limit(LIMIT)
    return {
      results: rows.map((r) => ({ id: r.id, label: r.label, sublabel: r.providerName })),
    }
  }

  if (type === 'email') {
    const rows = await db
      .select({ id: emailAddresses.id, address: emailAddresses.address, label: emailAddresses.label })
      .from(emailAddresses)
      .where(and(eq(emailAddresses.workspaceId, ws), ilike(emailAddresses.address, pattern)))
      .limit(LIMIT)
    return {
      results: rows.map((r) => ({ id: r.id, label: r.address, sublabel: r.label })),
    }
  }

  if (type === 'vault_ref') {
    const where = [eq(vaultReferences.workspaceId, ws), ilike(vaultReferences.label, pattern)]
    if (projectId) where.push(eq(vaultReferences.projectId, projectId))
    const rows = await db
      .select({ id: vaultReferences.id, label: vaultReferences.label, locationHint: vaultReferences.locationHint })
      .from(vaultReferences)
      .where(and(...where))
      .limit(LIMIT)
    return {
      results: rows.map((r) => ({ id: r.id, label: r.label, sublabel: r.locationHint })),
    }
  }

  if (type === 'config_entry') {
    const where = [eq(configEntries.workspaceId, ws), or(ilike(configEntries.key, pattern), ilike(configEntries.publicValue, pattern))!]
    if (projectId) where.push(eq(configEntries.projectId, projectId))
    const rows = await db
      .select({ id: configEntries.id, key: configEntries.key, publicValue: configEntries.publicValue })
      .from(configEntries)
      .where(and(...where))
      .limit(LIMIT)
    return {
      results: rows.map((r) => ({
        id: r.id,
        label: r.key,
        sublabel: r.publicValue ? String(r.publicValue).slice(0, 80) : null,
      })),
    }
  }

  return { results: [] }
})
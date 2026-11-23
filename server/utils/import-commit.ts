import { and, eq } from 'drizzle-orm'
import type { DuplicateResolutionAction, ImportTarget } from '../../shared/import/contract'
import {
  assetDependencies,
  assets,
  configEntries,
  emailAddresses,
  identities,
  identityEmails,
  importBatches,
  projectAssets,
  projectEnvironments,
  projects,
  providers,
  vaultReferences,
} from '../../db/schema'
import type { ParsedBundle } from './import-bundle'
import { buildMergeDiff } from './import-duplicates'
import { assetKeyFromRow, projectKeyFromRow } from './import-keys'
import { buildProviderCatalogIndex, resolveProviderId } from './import-providers'
import { findOrCreateEmail, linkAssetLoginEmail } from './inventory-links'
import { recordAudit } from './audit'
import type { useDb } from './db'
import { slugify } from './slug'

type ResolutionMap = Map<string, DuplicateResolutionAction>

export async function executeImportCommit(
  db: ReturnType<typeof useDb>,
  session: { workspaceId: string; id: string },
  previewBatchId: string,
  resolutions: Array<{ duplicateId: string; action: DuplicateResolutionAction }>,
) {
  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, previewBatchId), eq(importBatches.workspaceId, session.workspaceId)))
    .limit(1)

  if (!batch || batch.status !== 'preview' || !batch.previewJson) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired preview' })
  }

  const payload = batch.previewJson as {
    bundle: ParsedBundle
    target: ImportTarget
    duplicates: Array<{ id: string; existingAssetId: string; rowIndex: number; matchKey: string }>
  }

  const resolutionMap: ResolutionMap = new Map(resolutions.map((r) => [r.duplicateId, r.action]))
  const unresolved = payload.duplicates.filter((d) => !resolutionMap.has(d.id))
  if (unresolved.length) {
    throw createError({ statusCode: 400, statusMessage: 'Unresolved duplicates' })
  }

  const providerRows = await db.select().from(providers)
  const providerIndex = buildProviderCatalogIndex(providerRows)

  const duplicateByRow = new Map<number, { existingAssetId: string; action: DuplicateResolutionAction }>()
  for (const d of payload.duplicates) {
    const action = resolutionMap.get(d.id)!
    duplicateByRow.set(d.rowIndex, { existingAssetId: d.existingAssetId, action })
  }

  let focusedProjectSlug: string | undefined
  if (payload.target.mode === 'project') {
    const [p] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, payload.target.projectId), eq(projects.workspaceId, session.workspaceId)))
      .limit(1)
    focusedProjectSlug = p?.slug
  }

  const assetIdByKey = new Map<string, string>()

  function resolveAssetId(key: string, projectKey: string): string | undefined {
    if (assetIdByKey.has(key)) return assetIdByKey.get(key)
    const full = `${projectKey}::${key}`
    if (assetIdByKey.has(full)) return assetIdByKey.get(full)
    for (const [k, id] of assetIdByKey) {
      if (k.endsWith(`::${key}`) || k.endsWith(key)) return id
    }
    return undefined
  }
  let created = 0
  let merged = 0
  let skipped = 0

  const [updatedBatch] = await db
    .update(importBatches)
    .set({ status: 'committed', rowCount: payload.bundle.assets.rows.length })
    .where(eq(importBatches.id, previewBatchId))
    .returning()

  const defaultProjectName =
    payload.target.mode === 'new_project'
      ? payload.target.newProjectName
      : payload.target.mode === 'project'
        ? ''
        : ''

  async function ensureProject(projectKey: string, displayName: string) {
    let [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, session.workspaceId), eq(projects.slug, projectKey)))
      .limit(1)
    if (!project) {
      ;[project] = await db
        .insert(projects)
        .values({
          workspaceId: session.workspaceId,
          slug: projectKey,
          name: displayName || projectKey,
        })
        .returning()
    }
    return project
  }

  if (payload.target.mode === 'new_project') {
    await ensureProject(slugify(payload.target.newProjectName), payload.target.newProjectName)
  } else if (payload.target.mode === 'project') {
    const [p] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, payload.target.projectId), eq(projects.workspaceId, session.workspaceId)))
      .limit(1)
    if (!p) throw createError({ statusCode: 400, statusMessage: 'Project not found' })
  }

  for (let rowIndex = 0; rowIndex < payload.bundle.assets.rows.length; rowIndex++) {
    const row = payload.bundle.assets.rows[rowIndex]!
    const dup = duplicateByRow.get(rowIndex)
    if (dup?.action === 'skip') {
      skipped++
      const projectKey =
        payload.target.mode === 'new_project'
          ? slugify(payload.target.newProjectName)
          : payload.target.mode === 'project' && focusedProjectSlug
            ? focusedProjectSlug
            : projectKeyFromRow(row, defaultProjectName || 'imported')
      assetIdByKey.set(assetKeyFromRow(row, projectKey), dup.existingAssetId)
      continue
    }

    let projectKey: string
    let projectName: string
    if (payload.target.mode === 'new_project') {
      projectKey = slugify(payload.target.newProjectName)
      projectName = payload.target.newProjectName
    } else if (payload.target.mode === 'project' && focusedProjectSlug) {
      const [p] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, payload.target.projectId))
        .limit(1)
      projectKey = focusedProjectSlug
      projectName = p?.name ?? focusedProjectSlug
    } else {
      projectName = row.project || row.project_slug || row.asset_name || 'Imported'
      projectKey = projectKeyFromRow(row, projectName)
    }

    const project = await ensureProject(projectKey, projectName)
    if (dup?.action === 'merge') {
      const [existing] = await db.select().from(assets).where(eq(assets.id, dup.existingAssetId)).limit(1)
      if (existing) {
        const diff = buildMergeDiff(row, {
          id: existing.id,
          name: existing.name,
          externalIdentifier: existing.externalIdentifier,
          adminUrl: existing.adminUrl,
          publicUrl: existing.publicUrl,
          description: existing.description,
          verificationStatus: existing.verificationStatus,
          projectId: project.id,
          projectSlug: projectKey,
        })
        const patch: Partial<typeof existing> = {}
        if (diff.adminUrl) patch.adminUrl = diff.adminUrl.to
        if (diff.publicUrl) patch.publicUrl = diff.publicUrl.to
        if (diff.notes) patch.description = diff.notes.to
        if (diff.verificationStatus) patch.verificationStatus = diff.verificationStatus.to
        if (row.external_id?.trim() && !existing.externalIdentifier) {
          patch.externalIdentifier = row.external_id.trim()
        }
        if (Object.keys(patch).length) {
          await db.update(assets).set(patch).where(eq(assets.id, existing.id))
        }
        assetIdByKey.set(assetKeyFromRow(row, projectKey), existing.id)
        merged++
        continue
      }
    }

    const [asset] = await db
      .insert(assets)
      .values({
        workspaceId: session.workspaceId,
        name: row.asset_name || 'Unnamed asset',
        type: row.asset_type || 'other',
        providerId: resolveProviderId(row.provider ?? '', providerIndex),
        adminUrl: row.admin_url || null,
        publicUrl: row.public_url || null,
        description: row.notes || null,
        externalIdentifier: row.external_id?.trim() || null,
        source: 'import',
        importBatchId: updatedBatch.id,
        verificationStatus:
          row.verification_status?.trim() && ['unverified', 'declared', 'confirmed_by_human', 'verified_by_integration'].includes(row.verification_status.trim())
            ? row.verification_status.trim()
            : 'declared',
      })
      .returning()

    let environmentId: string | null = null
    const envName = (row.environment ?? '').trim().toLowerCase()
    if (envName) {
      const [env] = await db
        .select()
        .from(projectEnvironments)
        .where(
          and(
            eq(projectEnvironments.workspaceId, session.workspaceId),
            eq(projectEnvironments.projectId, project.id),
            eq(projectEnvironments.name, envName),
          ),
        )
        .limit(1)
      environmentId = env?.id ?? null
    }

    await db.insert(projectAssets).values({
      workspaceId: session.workspaceId,
      projectId: project.id,
      assetId: asset.id,
      environmentId,
    })

    const loginEmail = (row.login_email ?? '').trim()
    if (loginEmail && loginEmail.includes('@')) {
      const email = await findOrCreateEmail(db, session.workspaceId, loginEmail)
      await linkAssetLoginEmail(db, session.workspaceId, asset.id, email.id)
    }

    assetIdByKey.set(assetKeyFromRow(row, projectKey), asset.id)
    created++
  }

  const deps = payload.bundle.extras['dependencies.csv']
  if (deps?.rows.length) {
    for (const depRow of deps.rows) {
      const fromKey = depRow.from_asset_key?.trim()
      const toKey = depRow.to_asset_key?.trim()
      const rel = depRow.relation_type?.trim() || 'depends_on'
      if (!fromKey || !toKey) continue
      const pk =
        payload.target.mode === 'new_project'
          ? slugify(payload.target.newProjectName)
          : payload.target.mode === 'project' && focusedProjectSlug
            ? focusedProjectSlug
            : 'imported'
      const fromId = resolveAssetId(fromKey, pk)
      const toId = resolveAssetId(toKey, pk)
      if (!fromId || !toId || fromId === toId) continue
      try {
        await db.insert(assetDependencies).values({
          workspaceId: session.workspaceId,
          fromAssetId: fromId,
          toAssetId: toId,
          relationType: rel,
          description: depRow.description || null,
        })
      } catch {
        /* unique constraint — skip */
      }
    }
  }

  const emailsFile = payload.bundle.extras['emails.csv']
  if (emailsFile?.rows.length) {
    for (const er of emailsFile.rows) {
      const addr = er.email_address?.trim()
      if (!addr?.includes('@')) continue
      const [existing] = await db
        .select()
        .from(emailAddresses)
        .where(and(eq(emailAddresses.workspaceId, session.workspaceId), eq(emailAddresses.address, addr)))
        .limit(1)
      if (!existing) {
        await db.insert(emailAddresses).values({
          workspaceId: session.workspaceId,
          address: addr,
          label: er.label || null,
        })
      }
    }
  }

  const identitiesFile = payload.bundle.extras['identities.csv']
  if (identitiesFile?.rows.length) {
    for (const ir of identitiesFile.rows) {
      const label = ir.label?.trim() || ir.identity_key?.trim()
      if (!label) continue
      const login = ir.login_email?.trim()
      let identityId: string
      const [existing] = await db
        .select()
        .from(identities)
        .where(and(eq(identities.workspaceId, session.workspaceId), eq(identities.label, label)))
        .limit(1)
      if (existing) identityId = existing.id
      else {
        const [ins] = await db
          .insert(identities)
          .values({ workspaceId: session.workspaceId, label })
          .returning()
        identityId = ins.id
      }
      if (login?.includes('@')) {
        const email = await findOrCreateEmail(db, session.workspaceId, login)
        try {
          await db.insert(identityEmails).values({
            workspaceId: session.workspaceId,
            identityId,
            emailId: email.id,
            purpose: 'login',
          })
        } catch {
          /* already linked */
        }
      }
    }
  }

  const configFile = payload.bundle.extras['config_entries.csv']
  if (configFile?.rows.length) {
    for (const cr of configFile.rows) {
      const key = cr.key?.trim()
      if (!key) continue
      const assetKey = cr.asset_key?.trim()
      const assetId = assetKey ? assetIdByKey.get(assetKey) ?? [...assetIdByKey.values()][0] : null
      await db.insert(configEntries).values({
        workspaceId: session.workspaceId,
        assetId: assetId ?? null,
        key,
        description: cr.description || null,
        publicValue: cr.public_value || null,
        isSensitiveReference: false,
      })
    }
  }

  const vaultFile = payload.bundle.extras['vault_references.csv']
  if (vaultFile?.rows.length) {
    for (const vr of vaultFile.rows) {
      const label = vr.label?.trim()
      const hint = vr.location_hint?.trim()
      if (!label || !hint) continue
      const assetKey = vr.asset_key?.trim()
      const assetId = assetKey ? assetIdByKey.get(assetKey) : null
      await db.insert(vaultReferences).values({
        workspaceId: session.workspaceId,
        assetId: assetId ?? null,
        label,
        locationHint: hint,
        itemUrl: vr.item_url || null,
        notes: vr.notes || null,
      })
    }
  }

  await recordAudit(db, { workspaceId: session.workspaceId, userId: session.id }, {
    entityType: 'import_batch',
    entityId: updatedBatch.id,
    action: 'import.commit',
    safeDiff: { created, merged, skipped, status: 'committed' },
  })

  return { batchId: updatedBatch.id, created, merged, skipped }
}
import { and, eq, inArray, or } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  assetDependencies,
  assetEmails,
  assetRoles,
  assets,
  configEntries,
  emailAddresses,
  identities,
  projectAssets,
  projectEnvironments,
  projects,
  runbooks,
  runbookSteps,
  vaultReferences,
  verifications,
  workspaces,
} from '../../db/schema'
import type * as schema from '../../db/schema'
import { scanTextFields } from './secret-scan'
import { slugify } from './slug'

export type CopyRow = {
  id: string
  category: string
  label: string
  sensitivity: 'normal' | 'flagged' | 'blocked'
  blockReason?: string
  included: boolean
  payload: Record<string, unknown>
}

function flagConfig(key: string, isSensitive: boolean): 'normal' | 'flagged' {
  if (isSensitive) return 'flagged'
  if (/password|secret|token|private_key/i.test(key)) return 'flagged'
  return 'normal'
}

function scanBlocked(fields: Record<string, string | null | undefined>): string | undefined {
  const hit = scanTextFields(fields)
  return hit ? `Suspicious content in ${hit}` : undefined
}

export async function buildProjectCopyPreview(
  db: NodePgDatabase<typeof schema>,
  sourceProjectId: string,
  sourceWorkspaceId: string,
): Promise<{ rows: CopyRow[]; summary: Record<string, number> }> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, sourceProjectId), eq(projects.workspaceId, sourceWorkspaceId)))
    .limit(1)
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const rows: CopyRow[] = []

  const projectBlock = scanBlocked({
    description: project.description,
    name: project.name,
  })
  rows.push({
    id: `project:${project.id}`,
    category: 'project',
    label: project.name,
    sensitivity: projectBlock ? 'blocked' : 'normal',
    blockReason: projectBlock,
    included: !projectBlock,
    payload: { projectId: project.id },
  })

  const envs = await db
    .select()
    .from(projectEnvironments)
    .where(
      and(
        eq(projectEnvironments.projectId, sourceProjectId),
        eq(projectEnvironments.workspaceId, sourceWorkspaceId),
      ),
    )
  for (const env of envs) {
    const block = scanBlocked({ name: env.name })
    rows.push({
      id: `environment:${env.id}`,
      category: 'environment',
      label: env.name,
      sensitivity: block ? 'blocked' : 'normal',
      blockReason: block,
      included: !block,
      payload: { environmentId: env.id },
    })
  }

  const links = await db
    .select({ link: projectAssets, asset: assets })
    .from(projectAssets)
    .innerJoin(assets, eq(assets.id, projectAssets.assetId))
    .where(
      and(eq(projectAssets.projectId, sourceProjectId), eq(projectAssets.workspaceId, sourceWorkspaceId)),
    )

  const assetIds = new Set<string>()
  for (const { link, asset } of links) {
    assetIds.add(asset.id)
    const block = scanBlocked({
      description: asset.description,
      externalIdentifier: asset.externalIdentifier,
      publicUrl: asset.publicUrl,
    })
    const sensitivity = block ? 'blocked' : asset.passwordManagerItemUrl ? 'flagged' : 'normal'
    rows.push({
      id: `asset:${asset.id}`,
      category: 'asset',
      label: asset.name,
      sensitivity,
      blockReason: block,
      included: sensitivity !== 'blocked',
      payload: { assetId: asset.id, linkId: `${link.projectId}:${link.assetId}` },
    })
    rows.push({
      id: `project_asset:${link.projectId}:${link.assetId}`,
      category: 'project_asset',
      label: `${asset.name} link`,
      sensitivity: 'normal',
      included: true,
      payload: { assetId: asset.id, environmentId: link.environmentId, purpose: link.purpose },
    })
  }

  const assetIdList = [...assetIds]
  const configScope =
    assetIdList.length > 0
      ? or(
          and(eq(configEntries.workspaceId, sourceWorkspaceId), eq(configEntries.projectId, sourceProjectId)),
          and(eq(configEntries.workspaceId, sourceWorkspaceId), inArray(configEntries.assetId, assetIdList)),
        )
      : and(eq(configEntries.workspaceId, sourceWorkspaceId), eq(configEntries.projectId, sourceProjectId))

  const configs = await db.select().from(configEntries).where(configScope)
  for (const c of configs) {
    const block = scanBlocked({ publicValue: c.publicValue, description: c.description, key: c.key })
    rows.push({
      id: `config:${c.id}`,
      category: 'config',
      label: c.key,
      sensitivity: block ? 'blocked' : flagConfig(c.key, c.isSensitiveReference),
      blockReason: block,
      included: !block,
      payload: { configId: c.id },
    })
  }

  const vaultScope =
    assetIdList.length > 0
      ? or(
          and(eq(vaultReferences.workspaceId, sourceWorkspaceId), eq(vaultReferences.projectId, sourceProjectId)),
          and(eq(vaultReferences.workspaceId, sourceWorkspaceId), inArray(vaultReferences.assetId, assetIdList)),
        )
      : and(eq(vaultReferences.workspaceId, sourceWorkspaceId), eq(vaultReferences.projectId, sourceProjectId))

  const vaults = await db.select().from(vaultReferences).where(vaultScope)
  for (const v of vaults) {
    const block = scanBlocked({ notes: v.notes, locationHint: v.locationHint, label: v.label })
    rows.push({
      id: `vault:${v.id}`,
      category: 'vault',
      label: v.label,
      sensitivity: block ? 'blocked' : 'flagged',
      blockReason: block,
      included: !block,
      payload: { vaultId: v.id },
    })
  }

  if (assetIdList.length > 0) {
    const deps = await db
      .select()
      .from(assetDependencies)
      .where(
        and(
          eq(assetDependencies.workspaceId, sourceWorkspaceId),
          inArray(assetDependencies.fromAssetId, assetIdList),
        ),
      )
    for (const d of deps) {
      if (!assetIds.has(d.toAssetId)) continue
      const block = scanBlocked({ description: d.description })
      rows.push({
        id: `dependency:${d.id}`,
        category: 'dependency',
        label: `${d.relationType} (${d.fromAssetId.slice(0, 8)}…)`,
        sensitivity: block ? 'blocked' : 'normal',
        blockReason: block,
        included: !block,
        payload: { dependencyId: d.id },
      })
    }

    const emailLinks = await db
      .select({ link: assetEmails, email: emailAddresses })
      .from(assetEmails)
      .innerJoin(emailAddresses, eq(emailAddresses.id, assetEmails.emailId))
      .where(
        and(eq(assetEmails.workspaceId, sourceWorkspaceId), inArray(assetEmails.assetId, assetIdList)),
      )
    const emailSeen = new Set<string>()
    for (const { link, email } of emailLinks) {
      if (!emailSeen.has(email.id)) {
        emailSeen.add(email.id)
        const block = scanBlocked({ address: email.address, label: email.label })
        rows.push({
          id: `email:${email.id}`,
          category: 'email',
          label: email.address,
          sensitivity: block ? 'blocked' : 'flagged',
          blockReason: block,
          included: !block,
          payload: { emailId: email.id },
        })
      }
      rows.push({
        id: `asset_email:${link.id}`,
        category: 'asset_email',
        label: `${email.address} → asset`,
        sensitivity: link.passwordManagerItemUrl ? 'flagged' : 'flagged',
        included: true,
        payload: { assetEmailId: link.id, emailId: email.id, assetId: link.assetId, purpose: link.purpose },
      })
    }

    const roles = await db
      .select()
      .from(assetRoles)
      .where(and(eq(assetRoles.workspaceId, sourceWorkspaceId), inArray(assetRoles.assetId, assetIdList)))
    const identityIds = new Set<string>()
    for (const r of roles) {
      if (r.identityId) identityIds.add(r.identityId)
    }
    if (identityIds.size > 0) {
      const idRows = await db
        .select()
        .from(identities)
        .where(
          and(eq(identities.workspaceId, sourceWorkspaceId), inArray(identities.id, [...identityIds])),
        )
      for (const ident of idRows) {
        const block = scanBlocked({ notes: ident.notes, label: ident.label })
        rows.push({
          id: `identity:${ident.id}`,
          category: 'identity',
          label: ident.label,
          sensitivity: block ? 'blocked' : 'normal',
          blockReason: block,
          included: !block,
          payload: { identityId: ident.id },
        })
      }
    }
    for (const r of roles) {
      rows.push({
        id: `asset_role:${r.id}`,
        category: 'asset_role',
        label: `${r.roleType}${r.providerRoleLabel ? ` (${r.providerRoleLabel})` : ''}`,
        sensitivity: 'normal',
        included: true,
        payload: { assetRoleId: r.id },
      })
    }

    const verifs = await db
      .select()
      .from(verifications)
      .where(
        and(
          eq(verifications.workspaceId, sourceWorkspaceId),
          eq(verifications.sourceType, 'asset'),
          inArray(verifications.sourceId, assetIdList),
        ),
      )
    for (const v of verifs) {
      const block = scanBlocked({ evidenceNote: v.evidenceNote })
      rows.push({
        id: `verification:${v.id}`,
        category: 'verification',
        label: v.status,
        sensitivity: block ? 'blocked' : 'normal',
        blockReason: block,
        included: !block,
        payload: { verificationId: v.id },
      })
    }
  }

  const books = await db
    .select()
    .from(runbooks)
    .where(and(eq(runbooks.workspaceId, sourceWorkspaceId), eq(runbooks.projectId, sourceProjectId)))
  for (const rb of books) {
    const block = scanBlocked({ overviewMarkdown: rb.overviewMarkdown, title: rb.title })
    rows.push({
      id: `runbook:${rb.id}`,
      category: 'runbook',
      label: rb.title,
      sensitivity: block ? 'blocked' : 'normal',
      blockReason: block,
      included: !block,
      payload: { runbookId: rb.id },
    })
  }

  const summary = {
    total: rows.length,
    flagged: rows.filter((r) => r.sensitivity === 'flagged').length,
    blocked: rows.filter((r) => r.sensitivity === 'blocked').length,
  }
  return { rows, summary }
}

export async function commitProjectCopy(
  db: NodePgDatabase<typeof schema>,
  opts: {
    sourceProjectId: string
    sourceWorkspaceId: string
    targetWorkspaceId: string
    actorUserId: string
    selectedRowIds: string[]
    confirmFlagged: boolean
  },
): Promise<{ projectId: string }> {
  const preview = await buildProjectCopyPreview(db, opts.sourceProjectId, opts.sourceWorkspaceId)
  const selected = new Set(opts.selectedRowIds)
  const flaggedSelected = preview.rows.some(
    (r) => selected.has(r.id) && r.sensitivity === 'flagged',
  )
  if (flaggedSelected && !opts.confirmFlagged) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Confirm flagged rows',
      data: { code: 'confirm_flagged_required' },
    })
  }

  for (const row of preview.rows) {
    if (!selected.has(row.id)) continue
    if (row.sensitivity === 'blocked') {
      throw createError({ statusCode: 400, statusMessage: 'Blocked row in selection' })
    }
  }

  const [targetWs] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, opts.targetWorkspaceId))
    .limit(1)
  if (!targetWs || targetWs.type !== 'team') {
    throw createError({ statusCode: 400, statusMessage: 'Target must be a team workspace' })
  }

  const [sourceProject] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, opts.sourceProjectId), eq(projects.workspaceId, opts.sourceWorkspaceId)),
    )
    .limit(1)
  if (!sourceProject) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const idMap = new Map<string, string>()

  return await db.transaction(async (tx) => {
    const baseSlug = slugify(sourceProject.name)
    let slug = baseSlug
    let attempt = 0
    let newProject = null
    while (attempt < 5 && !newProject) {
      try {
        ;[newProject] = await tx
          .insert(projects)
          .values({
            workspaceId: opts.targetWorkspaceId,
            slug,
            name: sourceProject.name,
            description: sourceProject.description,
            websiteUrl: sourceProject.websiteUrl,
            createdByUserId: opts.actorUserId,
          })
          .returning()
      } catch (err: unknown) {
        if ((err as { code?: string }).code === '23505') {
          attempt++
          slug = `${baseSlug}-${attempt}`
          continue
        }
        throw err
      }
    }
    if (!newProject) throw createError({ statusCode: 500, statusMessage: 'Could not copy project' })

    const copyEnv = preview.rows.filter(
      (r) => r.category === 'environment' && selected.has(r.id),
    )
    for (const row of copyEnv) {
      const envId = row.payload.environmentId as string
      const [env] = await tx
        .select()
        .from(projectEnvironments)
        .where(eq(projectEnvironments.id, envId))
        .limit(1)
      if (!env) continue
      const [ins] = await tx
        .insert(projectEnvironments)
        .values({
          workspaceId: opts.targetWorkspaceId,
          projectId: newProject.id,
          name: env.name,
          kind: env.kind,
        })
        .returning()
      idMap.set(`environment:${envId}`, ins.id)
    }

    const copyAssets = preview.rows.filter((r) => r.category === 'asset' && selected.has(r.id))
    for (const row of copyAssets) {
      const assetId = row.payload.assetId as string
      const [asset] = await tx.select().from(assets).where(eq(assets.id, assetId)).limit(1)
      if (!asset) continue
      const [ins] = await tx
        .insert(assets)
        .values({
          workspaceId: opts.targetWorkspaceId,
          name: asset.name,
          type: asset.type,
          status: asset.status,
          criticality: asset.criticality,
          externalIdentifier: asset.externalIdentifier,
          adminUrl: asset.adminUrl,
          publicUrl: asset.publicUrl,
          description: asset.description,
          verificationStatus: asset.verificationStatus,
          source: asset.source,
          attributesJson: asset.attributesJson,
          passwordManagerItemUrl: asset.passwordManagerItemUrl,
        })
        .returning()
      idMap.set(`asset:${assetId}`, ins.id)
    }

    const copyLinks = preview.rows.filter((r) => r.category === 'project_asset' && selected.has(r.id))
    for (const row of copyLinks) {
      const oldAssetId = row.payload.assetId as string
      const newAssetId = idMap.get(`asset:${oldAssetId}`)
      if (!newAssetId) continue
      const oldEnvId = row.payload.environmentId as string | null
      const newEnvId = oldEnvId ? idMap.get(`environment:${oldEnvId}`) : null
      await tx.insert(projectAssets).values({
        workspaceId: opts.targetWorkspaceId,
        projectId: newProject.id,
        assetId: newAssetId,
        environmentId: newEnvId ?? null,
        purpose: (row.payload.purpose as string) ?? null,
      })
    }

    const copyIdentities = preview.rows.filter((r) => r.category === 'identity' && selected.has(r.id))
    for (const row of copyIdentities) {
      const identityId = row.payload.identityId as string
      const [ident] = await tx.select().from(identities).where(eq(identities.id, identityId)).limit(1)
      if (!ident) continue
      const [ins] = await tx
        .insert(identities)
        .values({
          workspaceId: opts.targetWorkspaceId,
          providerId: ident.providerId,
          label: ident.label,
          principalType: ident.principalType,
          authMethod: ident.authMethod,
          status: ident.status,
          verificationStatus: ident.verificationStatus,
          notes: ident.notes,
        })
        .returning()
      idMap.set(`identity:${identityId}`, ins.id)
    }

    const copyEmails = preview.rows.filter((r) => r.category === 'email' && selected.has(r.id))
    for (const row of copyEmails) {
      const emailId = row.payload.emailId as string
      const [email] = await tx.select().from(emailAddresses).where(eq(emailAddresses.id, emailId)).limit(1)
      if (!email) continue
      let newEmailId: string
      try {
        const [ins] = await tx
          .insert(emailAddresses)
          .values({
            workspaceId: opts.targetWorkspaceId,
            address: email.address,
            label: email.label,
            mailboxType: email.mailboxType,
            verificationStatus: email.verificationStatus,
            passwordManagerItemUrl: email.passwordManagerItemUrl,
          })
          .returning()
        newEmailId = ins.id
      } catch (err: unknown) {
        if ((err as { code?: string }).code !== '23505') throw err
        const [existing] = await tx
          .select()
          .from(emailAddresses)
          .where(
            and(
              eq(emailAddresses.workspaceId, opts.targetWorkspaceId),
              eq(emailAddresses.address, email.address),
            ),
          )
          .limit(1)
        if (!existing) throw err
        newEmailId = existing.id
      }
      idMap.set(`email:${emailId}`, newEmailId)
    }

    const copyRoles = preview.rows.filter((r) => r.category === 'asset_role' && selected.has(r.id))
    for (const row of copyRoles) {
      const roleId = row.payload.assetRoleId as string
      const [role] = await tx.select().from(assetRoles).where(eq(assetRoles.id, roleId)).limit(1)
      if (!role) continue
      const newAssetId = idMap.get(`asset:${role.assetId}`)
      if (!newAssetId) continue
      const newIdentityId = role.identityId ? idMap.get(`identity:${role.identityId}`) : null
      await tx.insert(assetRoles).values({
        workspaceId: opts.targetWorkspaceId,
        assetId: newAssetId,
        identityId: newIdentityId,
        roleType: role.roleType,
        providerRoleLabel: role.providerRoleLabel,
        verificationStatus: role.verificationStatus,
      })
    }

    const copyAssetEmails = preview.rows.filter((r) => r.category === 'asset_email' && selected.has(r.id))
    for (const row of copyAssetEmails) {
      const assetId = row.payload.assetId as string
      const emailId = row.payload.emailId as string
      const assetEmailId = row.payload.assetEmailId as string
      const newAssetId = idMap.get(`asset:${assetId}`)
      const newEmailId = idMap.get(`email:${emailId}`)
      if (!newAssetId || !newEmailId) continue
      const [linkRow] = await tx
        .select()
        .from(assetEmails)
        .where(eq(assetEmails.id, assetEmailId))
        .limit(1)
      await tx.insert(assetEmails).values({
        workspaceId: opts.targetWorkspaceId,
        assetId: newAssetId,
        emailId: newEmailId,
        purpose: (row.payload.purpose as string) ?? 'contact',
        passwordManagerItemUrl: linkRow?.passwordManagerItemUrl ?? null,
      })
    }

    const copyDeps = preview.rows.filter((r) => r.category === 'dependency' && selected.has(r.id))
    for (const row of copyDeps) {
      const depId = row.payload.dependencyId as string
      const [dep] = await tx.select().from(assetDependencies).where(eq(assetDependencies.id, depId)).limit(1)
      if (!dep) continue
      const fromId = idMap.get(`asset:${dep.fromAssetId}`)
      const toId = idMap.get(`asset:${dep.toAssetId}`)
      if (!fromId || !toId) continue
      await tx.insert(assetDependencies).values({
        workspaceId: opts.targetWorkspaceId,
        fromAssetId: fromId,
        toAssetId: toId,
        relationType: dep.relationType,
        description: dep.description,
        verificationStatus: dep.verificationStatus,
      })
    }

    const copyVerifs = preview.rows.filter((r) => r.category === 'verification' && selected.has(r.id))
    for (const row of copyVerifs) {
      const verifId = row.payload.verificationId as string
      const [v] = await tx.select().from(verifications).where(eq(verifications.id, verifId)).limit(1)
      if (!v) continue
      const newSourceId = idMap.get(`asset:${v.sourceId}`)
      if (!newSourceId) continue
      await tx.insert(verifications).values({
        workspaceId: opts.targetWorkspaceId,
        sourceType: v.sourceType,
        sourceId: newSourceId,
        status: v.status,
        evidenceNote: v.evidenceNote,
        assigneeUserId: null,
        checkedAt: v.checkedAt,
      })
    }

    const copyConfigs = preview.rows.filter((r) => r.category === 'config' && selected.has(r.id))
    for (const row of copyConfigs) {
      const configId = row.payload.configId as string
      const [c] = await tx.select().from(configEntries).where(eq(configEntries.id, configId)).limit(1)
      if (!c) continue
      await tx.insert(configEntries).values({
        workspaceId: opts.targetWorkspaceId,
        projectId: newProject.id,
        assetId: c.assetId ? idMap.get(`asset:${c.assetId}`) ?? null : null,
        key: c.key,
        description: c.description,
        valueType: c.valueType,
        publicValue: c.publicValue,
        isSensitiveReference: c.isSensitiveReference,
      })
    }

    const copyVaults = preview.rows.filter((r) => r.category === 'vault' && selected.has(r.id))
    for (const row of copyVaults) {
      const vaultId = row.payload.vaultId as string
      const [v] = await tx.select().from(vaultReferences).where(eq(vaultReferences.id, vaultId)).limit(1)
      if (!v) continue
      await tx.insert(vaultReferences).values({
        workspaceId: opts.targetWorkspaceId,
        projectId: newProject.id,
        assetId: v.assetId ? idMap.get(`asset:${v.assetId}`) ?? null : null,
        label: v.label,
        vaultProvider: v.vaultProvider,
        locationHint: v.locationHint,
        itemUrl: v.itemUrl,
        notes: v.notes,
      })
    }

    const copyRunbooks = preview.rows.filter((r) => r.category === 'runbook' && selected.has(r.id))
    for (const row of copyRunbooks) {
      const runbookId = row.payload.runbookId as string
      const [rb] = await tx.select().from(runbooks).where(eq(runbooks.id, runbookId)).limit(1)
      if (!rb) continue
      const [newRb] = await tx
        .insert(runbooks)
        .values({
          workspaceId: opts.targetWorkspaceId,
          projectId: newProject.id,
          environmentId: rb.environmentId ? idMap.get(`environment:${rb.environmentId}`) ?? null : null,
          title: rb.title,
          status: rb.status,
          overviewMarkdown: rb.overviewMarkdown,
          templateId: null,
        })
        .returning()
      const steps = await tx
        .select()
        .from(runbookSteps)
        .where(eq(runbookSteps.runbookId, runbookId))
      for (const st of steps) {
        await tx.insert(runbookSteps).values({
          workspaceId: opts.targetWorkspaceId,
          runbookId: newRb.id,
          stepKey: st.stepKey,
          position: st.position,
          kind: st.kind,
          title: st.title,
          bodyMarkdown: st.bodyMarkdown,
          risk: st.risk,
          dependsOnJson: st.dependsOnJson,
          isRequired: st.isRequired,
          source: st.source,
          defaultAssigneeUserId: null,
        })
      }
    }

    return { projectId: newProject.id }
  })
}
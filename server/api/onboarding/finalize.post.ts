import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  assetDependencies,
  assetRoles,
  assets,
  emailAddresses,
  identityEmails,
  identities,
  onboardingDrafts,
  projectAssets,
  projectEnvironments,
  projects,
  providerAccounts,
  providers,
  verifications,
} from '../../../db/schema'
import { findOrCreateEmail, linkAssetLoginEmail, linkIdentityLoginEmail } from '../../utils/inventory-links'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'
import { slugify } from '../../utils/slug'

const finalizeSchema = z.object({
  projectName: z.string().min(1),
  websiteUrl: z.string().optional(),
  description: z.string().optional(),
  identities: z.array(
    z.object({
      label: z.string(),
      providerSlug: z.string().optional().nullable(),
      unsure: z.boolean().optional(),
      loginEmail: z.string().optional().nullable(),
    }),
  ),
  assets: z.array(
    z.object({
      draftKey: z.string().optional(),
      name: z.string(),
      type: z.string(),
      providerSlug: z.string().optional().nullable(),
      accountLabel: z.string().optional().nullable(),
      unsure: z.boolean().optional(),
    }),
  ),
  accessLinks: z
    .array(
      z.object({
        identityLabel: z.string(),
        providerSlug: z.string(),
        roleType: z.string(),
        enabled: z.boolean().optional(),
      }),
    )
    .optional(),
  assetSetups: z
    .array(
      z.object({
        draftKey: z.string(),
        providerSlug: z.string().optional(),
        identityLabel: z.string().optional(),
        roleType: z.string().optional(),
        verificationStatus: z.enum(['declared', 'confirmed_by_human']).optional(),
        linkLoginEmail: z.boolean().optional(),
      }),
    )
    .optional(),
  dependencies: z
    .array(
      z.object({
        fromProviderSlug: z.string(),
        toProviderSlug: z.string(),
        relationType: z.string(),
        enabled: z.boolean().optional(),
      }),
    )
    .optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = finalizeSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const db = useDb()
  const providerRows = await db.select().from(providers)
  const bySlug = new Map(providerRows.map((p) => [p.slug, p.id]))

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId: session.workspaceId,
      slug: slugify(parsed.data.projectName),
      name: parsed.data.projectName,
      websiteUrl: parsed.data.websiteUrl || null,
      description: parsed.data.description ?? null,
    })
    .returning()

  await db.insert(projectEnvironments).values([
    { workspaceId: session.workspaceId, projectId: project.id, name: 'production', kind: 'production' },
    { workspaceId: session.workspaceId, projectId: project.id, name: 'development', kind: 'development' },
  ])

  const identityMap = new Map<string, string>()
  for (const item of parsed.data.identities) {
    if (item.unsure || !item.label) continue
    const [row] = await db
      .insert(identities)
      .values({
        workspaceId: session.workspaceId,
        label: item.label,
        providerId: item.providerSlug ? bySlug.get(item.providerSlug) ?? null : null,
        verificationStatus: 'declared',
      })
      .returning()
    identityMap.set(`${item.label}\0${item.providerSlug ?? ''}`, row.id)
    identityMap.set(item.label, row.id)

    const email = item.loginEmail?.trim()
    if (email) {
      await linkIdentityLoginEmail(db, session.workspaceId, row.id, email)
    }
  }

  const assetByProvider = new Map<string, string>()
  const assetByDraftKey = new Map<string, string>()
  for (const item of parsed.data.assets) {
    if (item.unsure || !item.name) continue
    let providerAccountId: string | null = null
    if (item.accountLabel) {
      const [acc] = await db
        .insert(providerAccounts)
        .values({
          workspaceId: session.workspaceId,
          label: item.accountLabel,
          providerId: item.providerSlug ? bySlug.get(item.providerSlug) ?? null : null,
          verificationStatus: 'declared',
        })
        .returning()
      providerAccountId = acc.id
    }

    const setup = item.providerSlug
      ? parsed.data.assetSetups?.find((s) => s.providerSlug === item.providerSlug)
      : undefined
    const assetVerification = setup?.verificationStatus ?? 'declared'

    const [asset] = await db
      .insert(assets)
      .values({
        workspaceId: session.workspaceId,
        name: item.name,
        type: item.type,
        providerId: item.providerSlug ? bySlug.get(item.providerSlug) ?? null : null,
        providerAccountId,
        verificationStatus: assetVerification,
        source: 'manual',
      })
      .returning()

    if (assetVerification === 'confirmed_by_human') {
      await db.insert(verifications).values({
        workspaceId: session.workspaceId,
        sourceType: 'asset',
        sourceId: asset.id,
        status: 'confirmed_by_human',
        evidenceNote: 'Confirmed during onboarding',
        checkedAt: new Date(),
        assigneeUserId: session.id,
      })
    }

    await db.insert(projectAssets).values({
      workspaceId: session.workspaceId,
      projectId: project.id,
      assetId: asset.id,
    })

    if (item.draftKey) assetByDraftKey.set(item.draftKey, asset.id)
    if (item.providerSlug && !assetByProvider.has(item.providerSlug)) {
      assetByProvider.set(item.providerSlug, asset.id)
    }
  }

  const identityLoginByLabel = new Map(
    parsed.data.identities
      .filter((i) => i.label && i.loginEmail?.trim())
      .map((i) => [i.label, i.loginEmail!.trim()]),
  )

  const setupRows = parsed.data.assetSetups ?? []
  if (setupRows.length) {
    for (const setup of setupRows) {
      const assetId =
        assetByDraftKey.get(setup.draftKey) ??
        (setup.providerSlug ? assetByProvider.get(setup.providerSlug) : undefined)
      const label = setup.identityLabel?.trim()
      if (!assetId || !label) continue
      const identityId =
        identityMap.get(`${label}\0${setup.providerSlug}`) ?? identityMap.get(label)
      if (!identityId) continue
      await db.insert(assetRoles).values({
        workspaceId: session.workspaceId,
        assetId,
        identityId,
        roleType: setup.roleType ?? 'admin',
        verificationStatus: setup.verificationStatus ?? 'declared',
      })
      if (setup.linkLoginEmail) {
        const loginEmail = identityLoginByLabel.get(label)
        if (loginEmail) {
          const emailRow = await findOrCreateEmail(db, session.workspaceId, loginEmail)
          await linkAssetLoginEmail(db, session.workspaceId, assetId, emailRow.id, identityId)
        }
      }
    }
  } else {
    for (const link of parsed.data.accessLinks ?? []) {
      if (link.enabled === false) continue
      const identityId =
        identityMap.get(`${link.identityLabel}\0${link.providerSlug}`) ?? identityMap.get(link.identityLabel)
      const assetId = assetByProvider.get(link.providerSlug)
      if (!identityId || !assetId) continue
      await db.insert(assetRoles).values({
        workspaceId: session.workspaceId,
        assetId,
        identityId,
        roleType: link.roleType,
        verificationStatus: 'declared',
      })
    }
  }

  for (const dep of parsed.data.dependencies ?? []) {
    if (dep.enabled === false) continue
    const fromId = assetByProvider.get(dep.fromProviderSlug)
    const toId = assetByProvider.get(dep.toProviderSlug)
    if (!fromId || !toId || fromId === toId) continue
    await db.insert(assetDependencies).values({
      workspaceId: session.workspaceId,
      fromAssetId: fromId,
      toAssetId: toId,
      relationType: dep.relationType,
      verificationStatus: 'declared',
    })
  }

  await db
    .update(onboardingDrafts)
    .set({ completedAt: new Date(), step: 6 })
    .where(eq(onboardingDrafts.workspaceId, session.workspaceId))

  return { projectId: project.id }
})
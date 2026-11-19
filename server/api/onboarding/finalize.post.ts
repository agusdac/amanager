import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  assets,
  identities,
  onboardingDrafts,
  projectAssets,
  projectEnvironments,
  projects,
  providerAccounts,
  providers,
} from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'
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
    }),
  ),
  assets: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      providerSlug: z.string().optional().nullable(),
      accountLabel: z.string().optional().nullable(),
      unsure: z.boolean().optional(),
    }),
  ),
})

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
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
    identityMap.set(item.label, row.id)
  }

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

    const [asset] = await db
      .insert(assets)
      .values({
        workspaceId: session.workspaceId,
        name: item.name,
        type: item.type,
        providerId: item.providerSlug ? bySlug.get(item.providerSlug) ?? null : null,
        providerAccountId,
        verificationStatus: 'declared',
        source: 'manual',
      })
      .returning()

    await db.insert(projectAssets).values({
      workspaceId: session.workspaceId,
      projectId: project.id,
      assetId: asset.id,
    })
  }

  await db
    .update(onboardingDrafts)
    .set({ completedAt: new Date(), step: 5 })
    .where(eq(onboardingDrafts.workspaceId, session.workspaceId))

  return { projectId: project.id }
})
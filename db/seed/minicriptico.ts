import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  assetDependencies,
  assetRoles,
  assets,
  emailAddresses,
  identities,
  projectAssets,
  projectEnvironments,
  projects,
  providerAccounts,
  providers,
  vaultReferences,
} from '../schema'
import type * as schema from '../schema'

export async function seedMiniCriptico(db: NodePgDatabase<typeof schema>, workspaceId: string) {
  const prov = Object.fromEntries(
    (await db.select().from(providers)).map((p) => [p.slug, p.id]),
  )

  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .limit(20)
  let projectId = existing.find((p) => p.slug === 'minicriptico')?.id

  if (!projectId) {
    const [project] = await db
      .insert(projects)
      .values({
        workspaceId,
        slug: 'minicriptico',
        name: 'Mini Críptico',
        description: 'Fictional dogfood project — unverified placeholders',
        websiteUrl: 'https://minicriptico.com',
      })
      .returning()
    projectId = project.id
  }

  const [envProd] = await db
    .insert(projectEnvironments)
    .values({ workspaceId, projectId, name: 'production', kind: 'production' })
    .returning()
  const [envDev] = await db
    .insert(projectEnvironments)
    .values({ workspaceId, projectId, name: 'development', kind: 'development' })
    .returning()

  const emails = ['Email A', 'Email B', 'Email C', 'Email D']
  const emailIds: string[] = []
  for (const label of emails) {
    const [row] = await db
      .insert(emailAddresses)
      .values({
        workspaceId,
        address: `${label.toLowerCase().replace(' ', '-')}@example.invalid`,
        label,
        verificationStatus: 'unverified',
      })
      .returning()
    emailIds.push(row.id)
  }

  const [googleA] = await db
    .insert(identities)
    .values({
      workspaceId,
      providerId: prov.google,
      label: 'Google A',
      verificationStatus: 'declared',
    })
    .returning()
  const [googleB] = await db
    .insert(identities)
    .values({
      workspaceId,
      providerId: prov.google,
      label: 'Google B',
      verificationStatus: 'declared',
    })
    .returning()

  const [accA] = await db
    .insert(providerAccounts)
    .values({
      workspaceId,
      providerId: prov.google,
      label: 'Google Account A',
      verificationStatus: 'declared',
    })
    .returning()
  const [accB] = await db
    .insert(providerAccounts)
    .values({
      workspaceId,
      providerId: prov.google,
      label: 'Google Account B',
      verificationStatus: 'declared',
    })
    .returning()

  async function mkAsset(
    name: string,
    type: string,
    providerSlug?: keyof typeof prov,
    providerAccountId?: string,
  ) {
    const [a] = await db
      .insert(assets)
      .values({
        workspaceId,
        name,
        type,
        providerId: providerSlug ? prov[providerSlug] : undefined,
        providerAccountId,
        verificationStatus: 'declared',
        source: 'seed',
      })
      .returning()
    await db.insert(projectAssets).values({
      workspaceId,
      projectId,
      assetId: a.id,
      environmentId: envProd.id,
    })
    return a
  }

  const oauth = await mkAsset('Google OAuth client', 'oauth_client', 'google', accA.id)
  const youtube = await mkAsset('YouTube channel', 'youtube_channel', 'youtube', accA.id)
  const gsc = await mkAsset('Search Console property', 'search_console', 'google', accB.id)
  const ads = await mkAsset('Google Ads account', 'google_ads', 'google', accB.id)
  const repo1 = await mkAsset('GitHub repo 1 (placeholder)', 'repository', 'github')
  const repo2 = await mkAsset('GitHub repo 2 (placeholder)', 'repository', 'github')
  const vps1 = await mkAsset('VPS-01 (placeholder)', 'vps', 'vps')
  const vps2 = await mkAsset('VPS-02 (placeholder)', 'vps', 'vps')
  const domain = await mkAsset('minicriptico.com domain', 'domain', 'namecheap')
  const mail = await mkAsset('OpenShip mail (placeholder)', 'mail_hosting', 'email')
  const cf = await mkAsset('Cloudflare storage (placeholder)', 'object_storage', 'cloudflare')
  const ses = await mkAsset('AWS SES (placeholder)', 'transactional_email', 'aws')

  await db.insert(assetRoles).values([
    { workspaceId, assetId: youtube.id, identityId: googleA.id, roleType: 'admin', verificationStatus: 'declared' },
    { workspaceId, assetId: gsc.id, identityId: googleB.id, roleType: 'admin', verificationStatus: 'declared' },
    { workspaceId, assetId: oauth.id, identityId: googleA.id, roleType: 'developer', verificationStatus: 'declared' },
  ])

  await db.insert(assetDependencies).values([
    { workspaceId, fromAssetId: oauth.id, toAssetId: vps1.id, relationType: 'hosted_on', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: oauth.id, toAssetId: repo1.id, relationType: 'authenticated_by', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: repo1.id, toAssetId: vps1.id, relationType: 'deployed_from', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: repo2.id, toAssetId: vps2.id, relationType: 'deployed_from', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: domain.id, toAssetId: vps1.id, relationType: 'depends_on', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: domain.id, toAssetId: mail.id, relationType: 'depends_on', verificationStatus: 'unverified' },
    { workspaceId, fromAssetId: ses.id, toAssetId: domain.id, relationType: 'verified_with', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: cf.id, toAssetId: repo1.id, relationType: 'stores_data_in', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: gsc.id, toAssetId: domain.id, relationType: 'verified_with', verificationStatus: 'declared' },
    { workspaceId, fromAssetId: ads.id, toAssetId: domain.id, relationType: 'depends_on', verificationStatus: 'unverified' },
    { workspaceId, fromAssetId: youtube.id, toAssetId: oauth.id, relationType: 'depends_on', verificationStatus: 'unverified' },
  ])

  await db.insert(vaultReferences).values({
    workspaceId,
    projectId,
    label: 'Google OAuth prod',
    locationHint: 'Bitwarden > Mini Críptico > Google OAuth (prod)',
    assetId: oauth.id,
  })

}
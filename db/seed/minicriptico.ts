import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  assetDependencies,
  assetEmails,
  assetRoles,
  assets,
  emailAddresses,
  identities,
  identityEmails,
  projectAssets,
  projectEnvironments,
  projects,
  providerAccounts,
  providers,
  configEntries,
  vaultReferences,
  verifications,
} from '../schema'
import type * as schema from '../schema'
import { resetMiniCripticoSeed } from './reset-minicriptico'

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
  } else {
    await resetMiniCripticoSeed(db, workspaceId, projectId)
  }

  const envRows = await db
    .select()
    .from(projectEnvironments)
    .where(and(eq(projectEnvironments.workspaceId, workspaceId), eq(projectEnvironments.projectId, projectId)))
  let envProd = envRows.find((e) => e.kind === 'production')
  let envDev = envRows.find((e) => e.kind === 'development')
  if (!envProd) {
    ;[envProd] = await db
      .insert(projectEnvironments)
      .values({ workspaceId, projectId, name: 'production', kind: 'production' })
      .returning()
  }
  if (!envDev) {
    ;[envDev] = await db
      .insert(projectEnvironments)
      .values({ workspaceId, projectId, name: 'development', kind: 'development' })
      .returning()
  }

  const emails = ['Email A', 'Email B', 'Email C', 'Email D']
  const emailIds: string[] = []
  const emailByLabel = new Map<string, string>()
  for (const label of emails) {
    const address = `${label.toLowerCase().replace(' ', '-')}@example.invalid`
    const [existing] = await db
      .select()
      .from(emailAddresses)
      .where(and(eq(emailAddresses.workspaceId, workspaceId), eq(emailAddresses.address, address)))
      .limit(1)
    const row =
      existing ??
      (
        await db
          .insert(emailAddresses)
          .values({
            workspaceId,
            address,
            label,
            verificationStatus: 'unverified',
          })
          .returning()
      )[0]
    emailIds.push(row.id)
    emailByLabel.set(label, row.id)
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

  await db.insert(configEntries).values([
    {
      workspaceId,
      projectId,
      assetId: oauth.id,
      key: 'oauth_client_id',
      description: 'Public OAuth client ID (not the client secret)',
      valueType: 'string',
      publicValue: '123456789012-abcdefghijklmnop.apps.googleusercontent.com',
      isSensitiveReference: false,
    },
    {
      workspaceId,
      projectId,
      assetId: oauth.id,
      key: 'redirect_uri_production',
      description: 'Authorized redirect URI — production',
      valueType: 'url',
      publicValue: 'https://minicriptico.com/api/auth/callback/google',
      isSensitiveReference: false,
    },
    {
      workspaceId,
      projectId,
      assetId: oauth.id,
      key: 'redirect_uri_development',
      description: 'Authorized redirect URI — development',
      valueType: 'url',
      publicValue: 'http://localhost:3000/api/auth/callback/google',
      isSensitiveReference: false,
    },
    {
      workspaceId,
      projectId,
      assetId: oauth.id,
      key: 'javascript_origin_production',
      description: 'Authorized JavaScript origin — production',
      valueType: 'url',
      publicValue: 'https://minicriptico.com',
      isSensitiveReference: false,
    },
  ])

  const emailA = emailByLabel.get('Email A')!
  const emailB = emailByLabel.get('Email B')!
  await db.insert(identityEmails).values([
    { workspaceId, identityId: googleA.id, emailId: emailA, purpose: 'login' },
    { workspaceId, identityId: googleB.id, emailId: emailB, purpose: 'login' },
  ])

  await db.insert(assetEmails).values([
    { workspaceId, assetId: youtube.id, emailId: emailA, purpose: 'login' },
    { workspaceId, assetId: gsc.id, emailId: emailB, purpose: 'login' },
    { workspaceId, assetId: oauth.id, emailId: emailA, purpose: 'login' },
  ])

  const verificationTargets = [
    {
      sourceId: gsc.id,
      status: 'dns_txt',
      evidenceNote: 'Domain property verified via DNS TXT on minicriptico.com (declared in dogfood seed).',
    },
    {
      sourceId: domain.id,
      status: 'registrar_lock',
      evidenceNote: 'Registrar: Namecheap; DNS delegated to Cloudflare (declared).',
    },
  ]
  for (const v of verificationTargets) {
    const [existingVerification] = await db
      .select({ id: verifications.id })
      .from(verifications)
      .where(
        and(
          eq(verifications.workspaceId, workspaceId),
          eq(verifications.sourceType, 'asset'),
          eq(verifications.sourceId, v.sourceId),
          eq(verifications.status, v.status),
        ),
      )
      .limit(1)
    if (!existingVerification) {
      await db.insert(verifications).values({
        workspaceId,
        sourceType: 'asset',
        sourceId: v.sourceId,
        status: v.status,
        evidenceNote: v.evidenceNote,
      })
    }
  }

  return { projectId }
}
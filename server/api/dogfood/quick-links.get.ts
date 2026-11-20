import { and, eq, inArray } from 'drizzle-orm'
import { assets, identities, projectAssets, projects } from '../../../db/schema'
import { useDb } from '../../utils/db'
import { requireSession } from '../../utils/session'

type QuickLink = { to: string; labelKey: string }

const IDENTITY_LABELS = ['Work Google Workspace admin', 'Client Google Cloud billing'] as const

const ASSET_NAMES = {
  oauth: 'Google OAuth client',
  youtube: 'YouTube channel',
  gsc: 'Search Console property',
  domain: 'northline.example domain',
  mail: 'OpenShip mail (placeholder)',
  ses: 'AWS SES (placeholder)',
  vps1: 'VPS-01 (placeholder)',
  repo1: 'GitHub repo 1 (placeholder)',
  cf: 'Cloudflare storage (placeholder)',
} as const

function link(to: string, labelKey: string): QuickLink {
  return { to, labelKey }
}

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb()

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, session.workspaceId), eq(projects.slug, 'northline-demo')))
    .limit(1)

  const identityRows = await db
    .select()
    .from(identities)
    .where(
      and(
        eq(identities.workspaceId, session.workspaceId),
        inArray(identities.label, [...IDENTITY_LABELS]),
      ),
    )

  const googleA = identityRows.find((i) => i.label === 'Work Google Workspace admin')?.id
  const googleB = identityRows.find((i) => i.label === 'Google B')?.id

  const assetIdByKey: Partial<Record<keyof typeof ASSET_NAMES, string>> = {}
  if (project) {
    const nameList = Object.values(ASSET_NAMES)
    const rows = await db
      .select({ id: assets.id, name: assets.name })
      .from(assets)
      .innerJoin(
        projectAssets,
        and(
          eq(projectAssets.assetId, assets.id),
          eq(projectAssets.projectId, project.id),
          eq(projectAssets.workspaceId, session.workspaceId),
        ),
      )
      .where(and(eq(assets.workspaceId, session.workspaceId), inArray(assets.name, nameList)))

    for (const [key, name] of Object.entries(ASSET_NAMES) as [keyof typeof ASSET_NAMES, string][]) {
      const row = rows.find((r) => r.name === name)
      if (row) assetIdByKey[key] = row.id
    }
  }

  const projectDep = project ? `/projects/${project.id}?tab=dependencies` : '/projects'
  const projectGraph = project ? `/projects/${project.id}?tab=graph` : '/projects'
  const projectEnv = project ? `/projects/${project.id}?tab=environments` : '/projects'

  const a = assetIdByKey

  const questions: Record<string, QuickLink[]> = {
    q1: [
      link('/accounts?tab=identities', 'checklist.links.identities'),
      ...(googleA ? [link(`/identities/${googleA}?tab=access`, 'checklist.links.googleA')] : []),
      ...(googleB ? [link(`/identities/${googleB}?tab=access`, 'checklist.links.googleB')] : []),
    ],
    q2: [
      link('/accounts?tab=emails', 'checklist.links.emails'),
      ...(googleA ? [link(`/identities/${googleA}?tab=impact`, 'checklist.links.impactEmailA')] : []),
    ],
    q3: a.oauth
      ? [
          link(`/assets/${a.oauth}?tab=config`, 'checklist.links.oauthConfig'),
          link(`/assets/${a.oauth}?tab=config`, 'checklist.links.vaultRefs'),
        ]
      : [link('/assets', 'nav.assets')],
    q4: a.youtube
      ? [link(`/assets/${a.youtube}?tab=access`, 'checklist.links.youtubeAccess')]
      : [link('/assets', 'nav.assets')],
    q5: [
      ...(a.gsc ? [link(`/assets/${a.gsc}?tab=verifications`, 'checklist.links.gsc')] : []),
      ...(a.domain ? [link(`/assets/${a.domain}?tab=verifications`, 'checklist.links.domain')] : []),
    ],
    q6: [
      ...(a.domain ? [link(`/assets/${a.domain}?tab=impact`, 'checklist.links.domainImpact')] : []),
      ...(a.mail ? [link(`/assets/${a.mail}?tab=dependencies`, 'checklist.links.mail')] : []),
      ...(a.ses ? [link(`/assets/${a.ses}?tab=dependencies`, 'checklist.links.ses')] : []),
      link(projectDep, 'checklist.links.projectDeps'),
    ],
    q7: [
      ...(a.vps1 ? [link(`/assets/${a.vps1}?tab=dependencies`, 'checklist.links.vps')] : []),
      ...(a.repo1 ? [link(`/assets/${a.repo1}?tab=dependencies`, 'checklist.links.repo')] : []),
      ...(a.oauth ? [link(`/assets/${a.oauth}?tab=config`, 'checklist.links.sshVault')] : []),
    ],
    q8: a.cf
      ? [
          link(`/assets/${a.cf}?tab=dependencies`, 'checklist.links.cloudflareStorage'),
          ...(a.repo1 ? [link(`/assets/${a.repo1}?tab=dependencies`, 'checklist.links.consumerRepo')] : []),
        ]
      : [link('/assets', 'nav.assets')],
    q9: [
      link('/accounts?tab=identities', 'checklist.links.identities'),
      ...(a.oauth ? [link(`/assets/${a.oauth}?tab=access`, 'checklist.links.oauthRoles')] : []),
    ],
    q10: [
      ...(a.repo1 ? [link(`/assets/${a.repo1}?tab=impact`, 'checklist.links.repoImpact')] : []),
      ...(a.domain ? [link(`/assets/${a.domain}?tab=impact`, 'checklist.links.domainImpact')] : []),
      ...(a.oauth ? [link(`/assets/${a.oauth}?tab=impact`, 'checklist.links.oauthImpact')] : []),
      link(projectGraph, 'checklist.links.projectMap'),
    ],
  }

  if (project) {
    questions.q3.push(link(projectEnv, 'checklist.links.environments'))
  }

  return { projectId: project?.id ?? null, questions }
})
import { eq } from 'drizzle-orm'
import { projects } from '../../../../db/schema'
import { recordAudit } from '../../../utils/audit'
import { useDb } from '../../../utils/db'
import { getRunbookOrThrow } from '../../../utils/runbooks/access'
import { buildRunbookMarkdown } from '../../../utils/runbooks/export'
import {
  exportLocaleFromEvent,
  listVisibleRunbookSteps,
  pendingCountInBodies,
  respondMarkdownExport,
} from '../../../utils/runbooks/queries'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const runbook = await getRunbookOrThrow(db, session.workspaceId, id)
  const [project] = await db.select().from(projects).where(eq(projects.id, runbook.projectId)).limit(1)

  const steps = await listVisibleRunbookSteps(db, session.workspaceId, id)
  const locale = exportLocaleFromEvent(event)
  const bodies = steps.map((s) => s.bodyMarkdown)
  const unverified = bodies.filter((b) => b.includes('needs confirmation')).length

  const md = buildRunbookMarkdown({
    title: runbook.title,
    projectName: project?.name ?? 'Project',
    projectSlug: project?.slug ?? 'project',
    templateSlug: runbook.templateSlug,
    templateVersion: 1,
    overviewMarkdown: runbook.overviewMarkdown,
    generatedAt: new Date(),
    locale,
    pendingCount: pendingCountInBodies(bodies),
    unverifiedAssetCount: unverified,
    steps: steps.map((s) => ({
      position: s.position,
      title: s.title,
      bodyMarkdown: s.bodyMarkdown,
      risk: s.risk,
      stepKey: s.stepKey,
    })),
  })

  await recordAudit(db, session, {
    entityType: 'runbook',
    entityId: id,
    action: 'export',
    safeDiff: { locale, source: 'runbook' },
  })

  return respondMarkdownExport(event, project?.slug ?? 'project', md)
})
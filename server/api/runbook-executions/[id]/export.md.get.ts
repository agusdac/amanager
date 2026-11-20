import { and, asc, eq } from 'drizzle-orm'
import {
  projects,
  runbookExecutionSteps,
  runbookStepResults,
  runbookSteps,
  runbooks,
} from '../../../../db/schema'
import { recordAudit } from '../../../utils/audit'
import { useDb } from '../../../utils/db'
import { getExecutionOrThrow } from '../../../utils/runbooks/access'
import { buildRunbookMarkdown } from '../../../utils/runbooks/export'
import {
  exportLocaleFromEvent,
  pendingCountInBodies,
  respondMarkdownExport,
} from '../../../utils/runbooks/queries'
import { requireSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const db = useDb()
  const execution = await getExecutionOrThrow(db, session.workspaceId, id)
  const [runbook] = await db.select().from(runbooks).where(eq(runbooks.id, execution.runbookId)).limit(1)
  if (!runbook) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const [project] = await db.select().from(projects).where(eq(projects.id, runbook.projectId)).limit(1)
  const locale = exportLocaleFromEvent(event)

  const results = await db
    .select()
    .from(runbookStepResults)
    .where(and(eq(runbookStepResults.executionId, id), eq(runbookStepResults.workspaceId, session.workspaceId)))

  let steps: Array<{ position: number; title: string; bodyMarkdown: string; risk: string }> = []

  if (execution.contentBinding === 'snapshot') {
    const snapshot = await db
      .select()
      .from(runbookExecutionSteps)
      .where(eq(runbookExecutionSteps.executionId, id))
      .orderBy(asc(runbookExecutionSteps.position))
    steps = snapshot.map((s) => {
      const r = results.find((x) => x.executionStepId === s.id)
      const note = r?.resultNote ? `\n\n_Result: ${r.status}_ — ${r.resultNote}` : ''
      return { position: s.position, title: s.title, bodyMarkdown: s.bodyMarkdown + note, risk: s.risk }
    })
  } else {
    const live = await db
      .select()
      .from(runbookSteps)
      .where(and(eq(runbookSteps.runbookId, execution.runbookId), eq(runbookSteps.workspaceId, session.workspaceId)))
      .orderBy(asc(runbookSteps.position))
    steps = live
      .filter((s) => !s.hiddenAt)
      .map((s) => {
        const r = results.find((x) => x.runbookStepId === s.id)
        const note = r?.resultNote ? `\n\n_Result: ${r.status}_ — ${r.resultNote}` : ''
        return { position: s.position, title: s.title, bodyMarkdown: s.bodyMarkdown + note, risk: s.risk }
      })
  }

  const md = buildRunbookMarkdown({
    title: runbook.title,
    projectName: project?.name ?? 'Project',
    projectSlug: project?.slug ?? 'project',
    templateSlug: runbook.templateSlug,
    templateVersion: 1,
    overviewMarkdown: runbook.overviewMarkdown,
    generatedAt: new Date(),
    locale,
    pendingCount: pendingCountInBodies(steps.map((s) => s.bodyMarkdown)),
    unverifiedAssetCount: 0,
    contentBinding: execution.contentBinding,
    steps,
  })

  await recordAudit(db, session, {
    entityType: 'runbook',
    entityId: runbook.id,
    action: 'export',
    safeDiff: { locale, source: 'execution', executionId: id },
  })

  return respondMarkdownExport(event, project?.slug ?? 'project', md)
})
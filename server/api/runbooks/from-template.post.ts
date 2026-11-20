import { runbookSteps, runbooks } from '../../../db/schema'
import { createRunbookFromTemplateSchema } from '../../../shared/schemas/runbooks'
import { recordAudit } from '../../utils/audit'
import { useDb } from '../../utils/db'
import { assertRunbookProject } from '../../utils/runbooks/access'
import { getTemplateBySlugForWorkspace } from '../../utils/runbooks/template-access'
import { loadRunbookContext } from '../../utils/runbooks/context'
import { generateStepsFromTemplate, type TemplateStepDef } from '../../utils/runbooks/generator'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = createRunbookFromTemplateSchema.parse(await readBody(event))
  const db = useDb()

  const template = await getTemplateBySlugForWorkspace(db, session.workspaceId, body.templateSlug)
  if (!template) throw createError({ statusCode: 404, statusMessage: 'Template not found' })

  const schemaJson = template.schemaJson as {
    requiredInputs?: string[]
    steps?: TemplateStepDef[]
  }
  const required = schemaJson.requiredInputs ?? []
  if (required.includes('environmentId') && !body.environmentId) {
    throw createError({ statusCode: 400, statusMessage: 'environmentId required for this template' })
  }

  const project = await assertRunbookProject(db, session.workspaceId, body.projectId)
  const ctx = await loadRunbookContext(db, session.workspaceId, body.projectId, body.environmentId)
  const templateSteps = schemaJson.steps ?? []
  const generated = generateStepsFromTemplate(templateSteps, ctx)

  const title = body.title ?? template.title

  const [runbook] = await db
    .insert(runbooks)
    .values({
      workspaceId: session.workspaceId,
      projectId: body.projectId,
      environmentId: body.environmentId ?? null,
      templateId: template.id,
      templateSlug: template.slug,
      title,
      status: 'draft',
      overviewMarkdown: template.contentMarkdown,
    })
    .returning()

  if (generated.length > 0) {
    await db.insert(runbookSteps).values(
      generated.map((s) => ({
        workspaceId: session.workspaceId,
        runbookId: runbook.id,
        stepKey: s.stepKey,
        position: s.position,
        kind: s.kind,
        title: s.title,
        bodyMarkdown: s.bodyMarkdown,
        risk: s.risk,
        dependsOnJson: s.dependsOn,
        source: s.source,
        isRequired: true,
      })),
    )
  }

  await recordAudit(db, session, {
    entityType: 'runbook',
    entityId: runbook.id,
    action: 'create',
    safeDiff: {
      projectId: body.projectId,
      templateSlug: template.slug,
      title,
      stepCount: generated.length,
    },
  })

  return { runbook, projectSlug: project.slug }
})
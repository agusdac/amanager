import { z } from 'zod'
import { workspaceTemplateStepSchema } from '../../../shared/schemas/runbooks'
import { useDb } from '../../utils/db'
import { exportLocaleFromEvent } from '../../utils/runbooks/queries'
import { previewWorkspaceStep } from '../../utils/runbooks/preview-step'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

const previewWorkspaceTemplateStepSchema = z.object({
  step: workspaceTemplateStepSchema,
  stepIndex: z.number().int().min(0).optional(),
  projectId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional(),
  locale: z.enum(['en', 'es']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = previewWorkspaceTemplateStepSchema.parse(await readBody(event))
  const locale = body.locale ?? (exportLocaleFromEvent(event) === 'es' ? 'es' : 'en')

  const db = useDb()
  return previewWorkspaceStep({
    workspaceId: session.workspaceId,
    step: body.step,
    stepIndex: body.stepIndex,
    projectId: body.projectId,
    environmentId: body.environmentId,
    locale,
    db,
  })
})
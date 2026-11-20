import type { z } from 'zod'
import { workspaceTemplateStepSchema } from '../../../shared/schemas/runbooks'
import { loadRunbookContext } from './context'
import { generateStepBody } from './generator'
import { sampleRunbookGenContext } from './sampleContext'
import { workspaceStepToTemplateDef } from './template-step-def'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../../../db/schema'

type WorkspaceStep = z.infer<typeof workspaceTemplateStepSchema>

export function mergeStepPreview(intro: string | undefined, body: string, generator: string) {
  const pre = intro?.trim()
  const isInventory = generator && generator !== 'static_markdown'
  if (isInventory && pre) return `${pre}\n\n---\n\n${body}`
  if (generator === 'static_markdown' && pre) return pre
  return body
}

export async function previewWorkspaceStep(input: {
  workspaceId: string
  step: WorkspaceStep
  stepIndex?: number
  projectId?: string
  environmentId?: string
  locale: 'en' | 'es'
  db: NodePgDatabase<typeof schema>
}) {
  const stepDef = workspaceStepToTemplateDef(input.step, input.stepIndex ?? 0)
  let ctx = sampleRunbookGenContext(input.locale)
  if (input.projectId) {
    ctx = await loadRunbookContext(input.db, input.workspaceId, input.projectId, input.environmentId)
    ctx.locale = input.locale
  } else {
    ctx.locale = input.locale
  }
  if (stepDef.generator === 'static_markdown') {
    const body = stepDef.bodyMarkdown?.trim() || '_Empty step body._'
    return { bodyMarkdown: body, pending: false, sample: !input.projectId }
  }
  const { body, pending } = generateStepBody(stepDef, ctx)
  return {
    bodyMarkdown: mergeStepPreview(input.step.bodyMarkdown, body, stepDef.generator),
    pending,
    sample: !input.projectId,
  }
}
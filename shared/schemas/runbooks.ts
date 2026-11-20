import { z } from 'zod'
import { INVENTORY_TARGET_TYPES, WORKSPACE_INVENTORY_GENERATORS } from '../runbooks/inventoryTargets'

export { INVENTORY_TARGET_TYPES, WORKSPACE_INVENTORY_GENERATORS }

export const RUNBOOK_STATUSES = ['draft', 'active', 'archived'] as const
export const RUNBOOK_STEP_KINDS = [
  'manual',
  'reference',
  'command_suggestion',
  'validation',
  'approval',
] as const
export const RUNBOOK_STEP_SOURCES = ['template', 'generated', 'manual'] as const
export const EXECUTION_STATUSES = ['in_progress', 'completed', 'cancelled'] as const
export const CONTENT_BINDINGS = ['snapshot', 'live'] as const
export const STEP_RESULT_STATUSES = [
  'todo',
  'blocked',
  'in_progress',
  'done',
  'skipped',
  'failed',
] as const

export const createRunbookFromTemplateSchema = z.object({
  templateSlug: z.string().min(1),
  projectId: z.string().uuid(),
  environmentId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
})

export const patchRunbookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(RUNBOOK_STATUSES).optional(),
  overviewMarkdown: z.string().max(50000).optional(),
})

export const createRunbookStepSchema = z.object({
  title: z.string().min(1).max(300),
  bodyMarkdown: z.string().max(50000).default(''),
  kind: z.enum(RUNBOOK_STEP_KINDS).default('manual'),
  risk: z.enum(['low', 'medium', 'high']).default('low'),
  dependsOn: z.array(z.string()).default([]),
})

export const patchRunbookStepSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  bodyMarkdown: z.string().max(50000).optional(),
  kind: z.enum(RUNBOOK_STEP_KINDS).optional(),
  risk: z.enum(['low', 'medium', 'high']).optional(),
  dependsOn: z.array(z.string()).optional(),
  hidden: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

export const startExecutionSchema = z.object({
  contentBinding: z.enum(CONTENT_BINDINGS).default('snapshot'),
})

export const patchExecutionSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
})

export const patchStepResultSchema = z.object({
  status: z.enum(STEP_RESULT_STATUSES),
  resultNote: z.string().max(8000).optional(),
})

export const refreshInventorySchema = z.object({
  acceptStepKeys: z.array(z.string()).optional(),
})

export const workspaceTemplateStepSchema = z.object({
  title: z.string().min(1).max(300),
  stepSource: z.enum(['markdown', 'inventory']).default('markdown'),
  inventoryGenerator: z.enum(WORKSPACE_INVENTORY_GENERATORS).optional(),
  inventoryScope: z.enum(['all', 'specific']).default('all'),
  inventoryTargetType: z.enum(INVENTORY_TARGET_TYPES).optional(),
  inventoryTargetId: z.string().uuid().optional(),
  inventoryTargetLabel: z.string().max(300).optional(),
  assetType: z.string().max(64).optional(),
  providerSlug: z.string().max(64).optional(),
  bodyMarkdown: z.string().max(50000).default(''),
  kind: z.enum(RUNBOOK_STEP_KINDS).default('manual'),
  risk: z.enum(['low', 'medium', 'high']).default('low'),
  dependsOnStepIndexes: z.array(z.number().int().min(0)).default([]),
})

export const upsertWorkspaceRunbookTemplateSchema = z
  .object({
    title: z.string().min(1).max(200),
    contentMarkdown: z.string().max(50000).optional(),
    requiresEnvironment: z.boolean().default(false),
    steps: z.array(workspaceTemplateStepSchema).min(1).max(100),
  })
  .superRefine((val, ctx) => {
    val.steps.forEach((s, i) => {
      if (s.stepSource === 'inventory' && !s.inventoryGenerator) {
        ctx.addIssue({
          code: 'custom',
          path: ['steps', i, 'inventoryGenerator'],
          message: 'inventoryGenerator required',
        })
      }
      if (s.stepSource === 'inventory' && s.inventoryScope === 'specific') {
        if (!s.inventoryTargetType || !s.inventoryTargetId) {
          ctx.addIssue({
            code: 'custom',
            path: ['steps', i, 'inventoryTargetId'],
            message: 'inventoryTargetId required',
          })
        }
      }
    })
  })
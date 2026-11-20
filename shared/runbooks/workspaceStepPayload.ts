import type { z } from 'zod'
import type { workspaceTemplateStepSchema } from '../schemas/runbooks'

export type WorkspaceTemplateStepInput = z.infer<typeof workspaceTemplateStepSchema>

/** Map editor step state to API / preview payload (trimmed fields). */
export function workspaceStepToPayload(step: {
  title: string
  stepSource: 'markdown' | 'inventory'
  inventoryGenerator?: string
  inventoryScope: 'all' | 'specific'
  inventoryTargetType?: string
  inventoryTargetId?: string
  inventoryTargetLabel?: string
  assetType?: string
  providerSlug?: string
  bodyMarkdown: string
  kind: string
  risk: string
  dependsOnStepIndexes: number[]
}): WorkspaceTemplateStepInput {
  const inventory = step.stepSource === 'inventory'
  return {
    title: step.title.trim(),
    stepSource: step.stepSource,
    inventoryGenerator: inventory ? (step.inventoryGenerator as WorkspaceTemplateStepInput['inventoryGenerator']) : undefined,
    inventoryScope: inventory ? step.inventoryScope : 'all',
    inventoryTargetType:
      inventory && step.inventoryScope === 'specific' && step.inventoryTargetType
        ? (step.inventoryTargetType as WorkspaceTemplateStepInput['inventoryTargetType'])
        : undefined,
    inventoryTargetId: inventory && step.inventoryScope === 'specific' ? step.inventoryTargetId || undefined : undefined,
    inventoryTargetLabel:
      inventory && step.inventoryScope === 'specific' ? step.inventoryTargetLabel || undefined : undefined,
    assetType: inventory && step.assetType ? step.assetType : undefined,
    providerSlug: inventory && step.providerSlug?.trim() ? step.providerSlug.trim() : undefined,
    bodyMarkdown: step.bodyMarkdown,
    kind: step.kind as WorkspaceTemplateStepInput['kind'],
    risk: step.risk as WorkspaceTemplateStepInput['risk'],
    dependsOnStepIndexes: step.dependsOnStepIndexes,
  }
}
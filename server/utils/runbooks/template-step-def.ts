import type { z } from 'zod'
import { workspaceTemplateStepSchema } from '../../../shared/schemas/runbooks'
import type { TemplateStepDef } from './generator'

type WorkspaceStep = z.infer<typeof workspaceTemplateStepSchema>

export function workspaceStepToTemplateDef(step: WorkspaceStep, index: number): TemplateStepDef {
  if (step.stepSource !== 'inventory' || !step.inventoryGenerator) {
    return {
      key: `step-${index + 1}`,
      kind: step.kind,
      title: step.title,
      risk: step.risk,
      generator: 'static_markdown',
      bodyMarkdown: step.bodyMarkdown,
    }
  }

  if (step.inventoryScope === 'specific' && step.inventoryTargetId && step.inventoryTargetType) {
    return {
      key: `step-${index + 1}`,
      kind: step.kind,
      title: step.title,
      risk: step.risk,
      generator: 'specific_reference',
      bodyMarkdown: step.bodyMarkdown,
      inventoryTargetType: step.inventoryTargetType,
      inventoryTargetId: step.inventoryTargetId,
      listGenerator: step.inventoryGenerator,
      ...(step.inventoryGenerator === 'asset_by_type'
        ? { assetType: step.assetType, providerSlug: step.providerSlug }
        : {}),
    }
  }

  const generator = step.inventoryGenerator
  return {
    key: `step-${index + 1}`,
    kind: step.kind,
    title: step.title,
    risk: step.risk,
    generator,
    bodyMarkdown: step.bodyMarkdown,
    ...(generator === 'asset_by_type'
      ? { assetType: step.assetType, providerSlug: step.providerSlug }
      : {}),
  }
}
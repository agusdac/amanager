import type { WorkspaceTemplateStepInput } from '../../../shared/runbooks/workspaceStepPayload'

export type { WorkspaceTemplateStepInput } from '../../../shared/runbooks/workspaceStepPayload'

export type TemplateSchemaJson = {
  requiredInputs?: string[]
  steps?: Array<{
    key: string
    title: string
    kind: string
    risk: string
    dependsOn?: string[]
    bodyMarkdown?: string
    generator?: string
    assetType?: string
    providerSlug?: string
    listGenerator?: string
    inventoryTargetType?: string
    inventoryTargetId?: string
    inventoryTargetLabel?: string
  }>
}

export function publicTemplateFromRow(row: {
  id: string
  slug: string
  version: number
  title: string
  schemaJson: unknown
  contentMarkdown: string | null
  workspaceId?: string | null
}) {
  const schema = (row.schemaJson ?? {}) as TemplateSchemaJson
  const steps = schema.steps ?? []
  return {
    id: row.id,
    slug: row.slug,
    version: row.version,
    title: row.title,
    scope: row.workspaceId ? ('workspace' as const) : ('system' as const),
    requiredInputs: schema.requiredInputs ?? [],
    description: row.contentMarkdown,
    stepCount: steps.length,
    stepsOutline: steps.map((s, i) => ({
      position: i + 1,
      key: s.key,
      title: s.title,
      kind: s.kind,
      risk: s.risk,
      dependsOn: s.dependsOn ?? [],
      bodyMarkdown: s.bodyMarkdown ?? null,
      generator: s.generator ?? 'static_markdown',
      listGenerator: (s as { listGenerator?: string }).listGenerator ?? null,
      assetType: (s as { assetType?: string }).assetType ?? null,
      providerSlug: (s as { providerSlug?: string }).providerSlug ?? null,
      inventoryTargetType: (s as { inventoryTargetType?: string }).inventoryTargetType ?? null,
      inventoryTargetId: (s as { inventoryTargetId?: string }).inventoryTargetId ?? null,
      inventoryTargetLabel: (s as { inventoryTargetLabel?: string }).inventoryTargetLabel ?? null,
      inventoryScope:
        s.generator === 'specific_reference' ? ('specific' as const) : ('all' as const),
    })),
  }
}

export function buildWorkspaceTemplateSchemaJson(input: {
  requiresEnvironment: boolean
  steps: WorkspaceTemplateStepInput[]
}): TemplateSchemaJson {
  return {
    requiredInputs: input.requiresEnvironment ? ['projectId', 'environmentId'] : ['projectId'],
    steps: input.steps.map((s, i) => {
      const key = `step-${i + 1}`
      const dependsOn = s.dependsOnStepIndexes
        .filter((idx) => idx >= 0 && idx < i)
        .map((idx) => `step-${idx + 1}`)
      const listGen = s.stepSource === 'inventory' && s.inventoryGenerator ? s.inventoryGenerator : 'static_markdown'
      const specific =
        s.stepSource === 'inventory' &&
        s.inventoryScope === 'specific' &&
        s.inventoryTargetId &&
        s.inventoryTargetType
      const generator = specific ? 'specific_reference' : listGen
      return {
        key,
        kind: s.kind,
        title: s.title,
        risk: s.risk,
        dependsOn,
        generator,
        bodyMarkdown: s.bodyMarkdown || undefined,
        ...(specific
          ? {
              listGenerator: listGen,
              inventoryTargetType: s.inventoryTargetType,
              inventoryTargetId: s.inventoryTargetId,
              inventoryTargetLabel: s.inventoryTargetLabel,
            }
          : {}),
        ...(listGen === 'asset_by_type'
          ? {
              assetType: s.assetType || undefined,
              providerSlug: s.providerSlug || undefined,
            }
          : {}),
      }
    }),
  }
}
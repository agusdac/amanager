import type { RUNBOOK_STEP_KINDS } from '#shared/schemas/runbooks'
import type { InventoryTargetType, WorkspaceInventoryGenerator } from '#shared/runbooks/inventoryTargets'

type StepKind = (typeof RUNBOOK_STEP_KINDS)[number]
type StepRisk = 'low' | 'medium' | 'high'

export type WorkspaceStepDraft = {
  title: string
  stepSource: 'markdown' | 'inventory'
  inventoryGenerator: WorkspaceInventoryGenerator
  inventoryScope: 'all' | 'specific'
  inventoryTargetType: InventoryTargetType | ''
  inventoryTargetId: string
  inventoryTargetLabel: string
  assetType: string
  providerSlug: string
  bodyMarkdown: string
  kind: StepKind
  risk: StepRisk
  dependsOnStepIndexes: number[]
}

export const WORKSPACE_TEMPLATE_PATTERN_IDS = [
  'change_registrar_email',
  'record_email_in_hilko',
  'link_vault_to_asset',
  'dns_cutover',
  'solo_identity_baseline',
  'solo_vacation_packet',
  'verify_and_close',
] as const

export type WorkspaceTemplatePatternId = (typeof WORKSPACE_TEMPLATE_PATTERN_IDS)[number]

type Translate = (key: string) => string

export function emptyWorkspaceStep(): WorkspaceStepDraft {
  return {
    title: '',
    stepSource: 'markdown',
    inventoryGenerator: 'inventory_overview',
    inventoryScope: 'all',
    inventoryTargetType: '',
    inventoryTargetId: '',
    inventoryTargetLabel: '',
    assetType: 'repository',
    providerSlug: '',
    bodyMarkdown: '',
    kind: 'manual',
    risk: 'low',
    dependsOnStepIndexes: [],
  }
}

function chainDepends(steps: WorkspaceStepDraft[]): WorkspaceStepDraft[] {
  return steps.map((s, i) => ({
    ...s,
    dependsOnStepIndexes: i > 0 ? [i - 1] : [],
  }))
}

function emptyInventoryFields(): Pick<
  WorkspaceStepDraft,
  'inventoryScope' | 'inventoryTargetType' | 'inventoryTargetId' | 'inventoryTargetLabel'
> {
  return {
    inventoryScope: 'all',
    inventoryTargetType: '',
    inventoryTargetId: '',
    inventoryTargetLabel: '',
  }
}

/** Registrar / DNS admin contact email change (e.g. Namecheap). */
export function patternChangeRegistrarEmail(t: Translate): WorkspaceStepDraft[] {
  return chainDepends([
    {
      title: t('guides.templates.patterns.changeRegistrarEmail.s1Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'inventory_overview',
      bodyMarkdown: t('guides.templates.patterns.changeRegistrarEmail.s1Body'),
      assetType: 'domain',
      providerSlug: 'namecheap',
      kind: 'validation',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
    {
      title: t('guides.templates.patterns.changeRegistrarEmail.s2Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'emails_overview',
      bodyMarkdown: t('guides.templates.patterns.changeRegistrarEmail.s2Body'),
      assetType: 'domain',
      providerSlug: '',
      kind: 'manual',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
    {
      title: t('guides.templates.patterns.changeRegistrarEmail.s3Title'),
      stepSource: 'inventory',
      inventoryGenerator: 'asset_by_type',
      inventoryScope: 'specific',
      inventoryTargetType: 'asset',
      inventoryTargetId: '',
      inventoryTargetLabel: '',
      assetType: 'domain',
      providerSlug: 'namecheap',
      bodyMarkdown: t('guides.templates.patterns.changeRegistrarEmail.s3Body'),
      kind: 'manual',
      risk: 'medium',
      dependsOnStepIndexes: [],
    },
    {
      title: t('guides.templates.patterns.changeRegistrarEmail.s4Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'inventory_overview',
      bodyMarkdown: t('guides.templates.patterns.changeRegistrarEmail.s4Body'),
      assetType: 'domain',
      providerSlug: '',
      kind: 'validation',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
  ])
}

export function patternRecordEmailInHilko(t: Translate): WorkspaceStepDraft[] {
  return chainDepends([
    {
      title: t('guides.templates.patterns.recordEmail.s1Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'emails_overview',
      bodyMarkdown: t('guides.templates.patterns.recordEmail.s1Body'),
      assetType: 'email',
      providerSlug: '',
      kind: 'manual',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
    {
      title: t('guides.templates.patterns.recordEmail.s2Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'emails_overview',
      bodyMarkdown: t('guides.templates.patterns.recordEmail.s2Body'),
      assetType: 'email',
      providerSlug: '',
      kind: 'validation',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
  ])
}

export function patternLinkVaultToAsset(t: Translate): WorkspaceStepDraft[] {
  return chainDepends([
    {
      title: t('guides.templates.patterns.linkVault.s1Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'vault_refs',
      bodyMarkdown: t('guides.templates.patterns.linkVault.s1Body'),
      assetType: 'password_manager',
      providerSlug: '',
      kind: 'reference',
      risk: 'medium',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
    {
      title: t('guides.templates.patterns.linkVault.s2Title'),
      stepSource: 'inventory',
      inventoryGenerator: 'vault_refs',
      inventoryScope: 'specific',
      inventoryTargetType: 'vault_ref',
      inventoryTargetId: '',
      inventoryTargetLabel: '',
      assetType: 'service',
      providerSlug: '',
      bodyMarkdown: t('guides.templates.patterns.linkVault.s2Body'),
      kind: 'manual',
      risk: 'medium',
      dependsOnStepIndexes: [],
    },
    {
      title: t('guides.templates.patterns.linkVault.s3Title'),
      stepSource: 'inventory',
      inventoryGenerator: 'asset_by_type',
      inventoryScope: 'specific',
      inventoryTargetType: 'asset',
      inventoryTargetId: '',
      inventoryTargetLabel: '',
      assetType: 'service',
      providerSlug: '',
      bodyMarkdown: t('guides.templates.patterns.linkVault.s3Body'),
      kind: 'manual',
      risk: 'low',
      dependsOnStepIndexes: [],
    },
  ])
}

export function patternDnsCutover(t: Translate): WorkspaceStepDraft[] {
  return chainDepends([
    {
      title: t('guides.templates.patterns.dnsCutover.s1Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'config_entries',
      bodyMarkdown: t('guides.templates.patterns.dnsCutover.s1Body'),
      assetType: 'dns',
      providerSlug: 'cloudflare',
      kind: 'manual',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
    {
      title: t('guides.templates.patterns.dnsCutover.s2Title'),
      stepSource: 'inventory',
      inventoryGenerator: 'asset_by_type',
      inventoryScope: 'specific',
      inventoryTargetType: 'asset',
      inventoryTargetId: '',
      inventoryTargetLabel: '',
      assetType: 'dns',
      providerSlug: 'cloudflare',
      bodyMarkdown: t('guides.templates.patterns.dnsCutover.s2Body'),
      kind: 'manual',
      risk: 'high',
      dependsOnStepIndexes: [],
    },
    {
      title: t('guides.templates.patterns.dnsCutover.s3Title'),
      stepSource: 'inventory',
      inventoryGenerator: 'asset_dependencies',
      inventoryScope: 'all',
      inventoryTargetType: '',
      inventoryTargetId: '',
      inventoryTargetLabel: '',
      assetType: 'dns',
      providerSlug: '',
      bodyMarkdown: t('guides.templates.patterns.dnsCutover.s3Body'),
      kind: 'validation',
      risk: 'medium',
      dependsOnStepIndexes: [],
    },
    {
      title: t('guides.templates.patterns.dnsCutover.s4Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'inventory_overview',
      bodyMarkdown: t('guides.templates.patterns.dnsCutover.s4Body'),
      assetType: 'dns',
      providerSlug: '',
      kind: 'validation',
      risk: 'medium',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
  ])
}

/** Solo operator: confirm one identity owns the roles you think. */
export function patternSoloIdentityBaseline(t: Translate): WorkspaceStepDraft[] {
  return chainDepends([
    {
      title: t('guides.templates.patterns.soloIdentity.s1Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'identities_overview',
      bodyMarkdown: t('guides.templates.patterns.soloIdentity.s1Body'),
      assetType: 'service',
      providerSlug: '',
      kind: 'manual',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
    {
      title: t('guides.templates.patterns.soloIdentity.s2Title'),
      stepSource: 'inventory',
      inventoryGenerator: 'identities_roles',
      inventoryScope: 'all',
      inventoryTargetType: '',
      inventoryTargetId: '',
      inventoryTargetLabel: '',
      assetType: 'service',
      providerSlug: '',
      bodyMarkdown: t('guides.templates.patterns.soloIdentity.s2Body'),
      kind: 'validation',
      risk: 'medium',
      dependsOnStepIndexes: [],
    },
    {
      title: t('guides.templates.patterns.soloIdentity.s3Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'emails_overview',
      bodyMarkdown: t('guides.templates.patterns.soloIdentity.s3Body'),
      assetType: 'email',
      providerSlug: '',
      kind: 'validation',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
  ])
}

/** Solo operator: “future me” / emergency packet before vacation. */
export function patternSoloVacationPacket(t: Translate): WorkspaceStepDraft[] {
  return chainDepends([
    {
      title: t('guides.templates.patterns.soloVacation.s1Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'inventory_overview',
      bodyMarkdown: t('guides.templates.patterns.soloVacation.s1Body'),
      assetType: 'service',
      providerSlug: '',
      kind: 'manual',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
    {
      title: t('guides.templates.patterns.soloVacation.s2Title'),
      stepSource: 'inventory',
      inventoryGenerator: 'vault_refs',
      inventoryScope: 'all',
      inventoryTargetType: '',
      inventoryTargetId: '',
      inventoryTargetLabel: '',
      assetType: 'password_manager',
      providerSlug: '',
      bodyMarkdown: t('guides.templates.patterns.soloVacation.s2Body'),
      kind: 'reference',
      risk: 'high',
      dependsOnStepIndexes: [],
    },
    {
      title: t('guides.templates.patterns.soloVacation.s3Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'inventory_overview',
      bodyMarkdown: t('guides.templates.patterns.soloVacation.s3Body'),
      assetType: 'service',
      providerSlug: '',
      kind: 'approval',
      risk: 'medium',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
  ])
}

export function patternVerifyAndClose(t: Translate): WorkspaceStepDraft[] {
  return [
    {
      title: t('guides.templates.patterns.verifyClose.s1Title'),
      stepSource: 'markdown',
      inventoryGenerator: 'inventory_overview',
      bodyMarkdown: t('guides.templates.patterns.verifyClose.s1Body'),
      assetType: 'repository',
      providerSlug: '',
      kind: 'validation',
      risk: 'low',
      dependsOnStepIndexes: [],
      ...emptyInventoryFields(),
    },
  ]
}

export function buildWorkspacePattern(id: WorkspaceTemplatePatternId, t: Translate): WorkspaceStepDraft[] {
  switch (id) {
    case 'change_registrar_email':
      return patternChangeRegistrarEmail(t)
    case 'record_email_in_hilko':
      return patternRecordEmailInHilko(t)
    case 'link_vault_to_asset':
      return patternLinkVaultToAsset(t)
    case 'dns_cutover':
      return patternDnsCutover(t)
    case 'solo_identity_baseline':
      return patternSoloIdentityBaseline(t)
    case 'solo_vacation_packet':
      return patternSoloVacationPacket(t)
    case 'verify_and_close':
      return patternVerifyAndClose(t)
    default:
      return []
  }
}

export const HILKO_MARKDOWN_SNIPPETS = [
  { id: 'emails', labelKey: 'guides.templates.snippets.emails' },
  { id: 'identities', labelKey: 'guides.templates.snippets.identities' },
  { id: 'assets', labelKey: 'guides.templates.snippets.assets' },
  { id: 'projects', labelKey: 'guides.templates.snippets.projects' },
] as const

export function hilkoSnippetMarkdown(id: (typeof HILKO_MARKDOWN_SNIPPETS)[number]['id'], t: Translate): string {
  const templates: Record<string, string> = {
    emails: t('guides.templates.snippets.emailsMd'),
    identities: t('guides.templates.snippets.identitiesMd'),
    assets: t('guides.templates.snippets.assetsMd'),
    projects: t('guides.templates.snippets.projectsMd'),
  }
  return templates[id] ?? ''
}
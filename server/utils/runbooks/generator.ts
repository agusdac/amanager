import { formatAssetMarkdownLine, splitPlaceholderAssetName } from '../../../shared/runbooks/inventoryMarkdown'
import type { RunbookGenContext } from './context'

export type TemplateStepDef = {
  key: string
  kind: string
  title: string
  risk: string
  dependsOn?: string[]
  generator: string
  assetType?: string
  providerSlug?: string
  bodyMarkdown?: string
  inventoryTargetType?: string
  inventoryTargetId?: string
  listGenerator?: string
}

export type GeneratedStep = {
  stepKey: string
  position: number
  kind: string
  title: string
  bodyMarkdown: string
  risk: string
  dependsOn: string[]
  source: 'generated'
  isPending: boolean
}

function pendingBlock(what: string, hint: string): string {
  return `> **Pending in inventory** — ${what}\n>\n> ${hint}\n`
}

function assetLink(id: string, name: string): string {
  return `[${name}](/assets/${id})`
}

function localeOf(ctx: RunbookGenContext): 'en' | 'es' {
  return ctx.locale === 'es' ? 'es' : 'en'
}

function assetLine(ctx: RunbookGenContext, a: (typeof ctx.assets)[number]) {
  return formatAssetMarkdownLine(
    {
      id: a.id,
      name: a.name,
      type: a.type,
      adminUrl: a.adminUrl,
      publicUrl: a.publicUrl,
      verificationStatus: a.verificationStatus,
      providerSlug: a.providerSlug,
    },
    localeOf(ctx),
  )
}

function filterEnvAssets(ctx: RunbookGenContext) {
  if (!ctx.environment) return ctx.assets
  return ctx.assets.filter((a) => !a.environmentId || a.environmentId === ctx.environment!.id)
}

export function generateStepBody(step: TemplateStepDef, ctx: RunbookGenContext): { body: string; pending: boolean } {
  const envAssets = filterEnvAssets(ctx)

  switch (step.generator) {
    case 'inventory_overview': {
      if (envAssets.length === 0) {
        return {
          body:
            pendingBlock('No assets linked to this project yet.', 'Open the project map and add resources.') +
            `\nProject: **${ctx.project.name}**`,
          pending: true,
        }
      }
      const lines = envAssets.map((a) => assetLine(ctx, a))
      return {
        body: `Project **${ctx.project.name}** — linked assets:\n\n${lines.join('\n')}`,
        pending: false,
      }
    }
    case 'environment_scope': {
      if (!ctx.environment) {
        return {
          body: pendingBlock('No environment selected.', 'Pick a target environment when creating this runbook.'),
          pending: true,
        }
      }
      const inEnv = envAssets.length
      return {
        body: `Target environment: **${ctx.environment.name}** (\`${ctx.environment.kind}\`)\n\nAssets in scope: ${inEnv}`,
        pending: inEnv === 0,
      }
    }
    case 'asset_by_type': {
      const matches = envAssets.filter((a) => {
        if (step.assetType && a.type !== step.assetType) return false
        if (step.providerSlug && a.providerSlug !== step.providerSlug) return false
        return true
      })
      if (matches.length === 0) {
        const label = [step.providerSlug, step.assetType].filter(Boolean).join(' / ') || 'resource'
        return {
          body: pendingBlock(
            `No \`${label}\` asset linked to this project.`,
            `Add the asset under **Projects → ${ctx.project.name}** and link it to the environment.`,
          ),
          pending: true,
        }
      }
      const lines = matches.map((a) => assetLine(ctx, a))
      return { body: lines.join('\n'), pending: false }
    }
    case 'vault_refs': {
      if (ctx.vaultRefs.length === 0) {
        return {
          body: pendingBlock(
            'No vault references for this project.',
            'Add Bitwarden/1Password item links (metadata only) on assets or the project.',
          ),
          pending: true,
        }
      }
      const lines = ctx.vaultRefs.map(
        (v) => `- **${v.label}** — ${v.locationHint}${v.itemUrl ? ` ([open vault item](${v.itemUrl}))` : ''}`,
      )
      return { body: `Use the vault for secret values — never paste them into Hilko.\n\n${lines.join('\n')}`, pending: false }
    }
    case 'config_entries': {
      const nonSecret = ctx.configEntries.filter((c) => !c.isSensitiveReference)
      if (nonSecret.length === 0) {
        return {
          body: pendingBlock(
            'No documented non-secret config keys.',
            'Add config entries (public values or vault references only).',
          ),
          pending: true,
        }
      }
      const lines = nonSecret.map((c) => `- \`${c.key}\`${c.publicValue ? `: ${c.publicValue}` : ' _(vault ref)_'}`)
      return { body: `Non-secret configuration keys:\n\n${lines.join('\n')}`, pending: false }
    }
    case 'identities_roles': {
      if (ctx.roles.length === 0) {
        return {
          body: pendingBlock('No asset roles documented.', 'Assign identities to assets under each asset’s Access tab.'),
          pending: true,
        }
      }
      const lines = ctx.roles.map(
        (r) => `- ${r.assetName}: **${r.roleType}**${r.identityLabel ? ` — ${r.identityLabel}` : ''}`,
      )
      return { body: lines.join('\n'), pending: false }
    }
    case 'identities_overview': {
      if (ctx.identities.length === 0) {
        return { body: pendingBlock('No identities.', 'Add identities under Accounts.'), pending: true }
      }
      const lines = ctx.identities.map((i) => `- [${i.label}](/accounts?tab=identities)`)
      return { body: lines.join('\n'), pending: false }
    }
    case 'emails_overview': {
      if (ctx.emails.length === 0) {
        return { body: pendingBlock('No email addresses recorded.', 'Add mailboxes under Accounts → Emails.'), pending: true }
      }
      const lines = ctx.emails.map((e) => `- ${e.address}${e.label ? ` (${e.label})` : ''}`)
      return { body: lines.join('\n'), pending: false }
    }
    case 'asset_dependencies': {
      if (ctx.dependencies.length === 0) {
        return {
          body: pendingBlock(
            'No dependencies between project assets yet.',
            'Link dependencies on each asset’s Relations tab.',
          ),
          pending: true,
        }
      }
      const lines = ctx.dependencies.map((d) => {
        const desc = d.description ? ` — ${d.description}` : ''
        const from = splitPlaceholderAssetName(d.fromName).displayName
        const to = splitPlaceholderAssetName(d.toName).displayName
        return `- ${assetLink(d.fromAssetId, from)} → **${d.relationType}** → ${assetLink(d.toAssetId, to)}${desc}`
      })
      return { body: `Project dependency map:\n\n${lines.join('\n')}`, pending: false }
    }
    case 'manual_checklist':
      return {
        body: 'Complete this step manually and record the outcome in the execution notes.',
        pending: false,
      }
    case 'static_markdown': {
      const body = step.bodyMarkdown?.trim()
      return { body: body || '_Empty step body._', pending: false }
    }
    case 'specific_reference': {
      const id = step.inventoryTargetId
      const t = step.inventoryTargetType
      if (!id || !t) {
        return { body: '_No reference configured._', pending: true }
      }
      if (t === 'asset') {
        const a = envAssets.find((x) => x.id === id)
        if (!a) {
          return {
            body: pendingBlock(
              'Selected asset is not linked to this project.',
              'Link the asset to the project or pick another reference.',
            ),
            pending: true,
          }
        }
        return { body: assetLine(ctx, a), pending: false }
      }
      if (t === 'identity') {
        const i = ctx.identities.find((x) => x.id === id)
        if (!i) {
          return {
            body: pendingBlock('Identity not found in workspace.', 'Pick an identity under Accounts.'),
            pending: true,
          }
        }
        return { body: `- [${i.label}](/identities/${i.id})`, pending: false }
      }
      if (t === 'email') {
        const e = ctx.emails.find((x) => x.id === id)
        if (!e) {
          return {
            body: pendingBlock('Email not found.', 'Add it under Accounts → Emails.'),
            pending: true,
          }
        }
        return { body: `- ${e.address}${e.label ? ` (${e.label})` : ''}`, pending: false }
      }
      if (t === 'vault_ref') {
        const v = ctx.vaultRefs.find((x) => x.id === id)
        if (!v) {
          return {
            body: pendingBlock(
              'Vault reference not in this project.',
              'Add vault metadata on the project or choose another item.',
            ),
            pending: true,
          }
        }
        return {
          body: `- **${v.label}** — ${v.locationHint}${v.itemUrl ? ` ([open](${v.itemUrl}))` : ''}`,
          pending: false,
        }
      }
      if (t === 'config_entry') {
        const c = ctx.configEntries.find((x) => x.id === id)
        if (!c) {
          return {
            body: pendingBlock('Config entry not in this project.', 'Add a config entry on the project.'),
            pending: true,
          }
        }
        const val = c.publicValue ? `: ${c.publicValue}` : c.isSensitiveReference ? ' _(vault ref)_' : ''
        return { body: `- \`${c.key}\`${val}`, pending: false }
      }
      return { body: '_Unknown reference type._', pending: true }
    }
    default:
      return { body: '_No generator for this step._', pending: true }
  }
}

export function generateStepsFromTemplate(
  templateSteps: TemplateStepDef[],
  ctx: RunbookGenContext,
): GeneratedStep[] {
  return templateSteps.map((step, index) => {
    const { body, pending } = generateStepBody(step, ctx)
    const intro = step.bodyMarkdown?.trim()
    const isInventory = step.generator && step.generator !== 'static_markdown'
    const bodyMarkdown = isInventory && intro ? `${intro}\n\n---\n\n${body}` : body
    return {
      stepKey: step.key,
      position: index,
      kind: step.kind,
      title: step.title,
      bodyMarkdown,
      risk: step.risk,
      dependsOn: step.dependsOn ?? [],
      source: 'generated',
      isPending: pending,
    }
  })
}
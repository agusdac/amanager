import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { runbookTemplates } from '../schema'
import type * as schema from '../schema'

type TemplateStep = {
  key: string
  kind: string
  title: string
  risk: string
  dependsOn?: string[]
  generator: string
  assetType?: string
  providerSlug?: string
  bodyMarkdown?: string
}

type TemplateDef = {
  slug: string
  title: string
  requiredInputs: string[]
  steps: TemplateStep[]
  overview: string
}

const TEMPLATES: TemplateDef[] = [
  {
    slug: 'new-developer-onboarding',
    title: 'Onboard a new developer',
    requiredInputs: ['projectId', 'environmentId'],
    overview:
      'Use this runbook when a new collaborator needs their own accounts and local setup—not shared founder passwords.',
    steps: [
      {
        key: 'open-emails',
        kind: 'manual',
        title: 'Confirm team mailboxes are documented in Hilko',
        risk: 'low',
        generator: 'static_markdown',
        bodyMarkdown:
          'Open [Emails & access](/accounts?tab=emails) and ensure each collaborator has an individual mailbox recorded (no shared “team” login labels without notes).',
      },
      {
        key: 'review-inventory',
        kind: 'manual',
        title: 'Review project inventory in Hilko',
        risk: 'low',
        dependsOn: ['open-emails'],
        generator: 'inventory_overview',
      },
      {
        key: 'github-access',
        kind: 'manual',
        title: 'Confirm individual GitHub repository access',
        risk: 'low',
        dependsOn: ['review-inventory'],
        generator: 'asset_by_type',
        assetType: 'repository',
        providerSlug: 'github',
      },
      {
        key: 'env-vault',
        kind: 'reference',
        title: 'Prepare environment variables using the vault',
        risk: 'medium',
        dependsOn: ['github-access'],
        generator: 'vault_refs',
      },
      {
        key: 'local-runtime',
        kind: 'manual',
        title: 'Install runtime versions documented for the project',
        risk: 'low',
        dependsOn: ['github-access'],
        generator: 'config_entries',
      },
      {
        key: 'oauth-dev',
        kind: 'reference',
        title: 'Configure development OAuth (separate from production)',
        risk: 'medium',
        dependsOn: ['env-vault'],
        generator: 'asset_by_type',
        assetType: 'oauth_client',
        providerSlug: 'google',
      },
      {
        key: 'smoke-test',
        kind: 'validation',
        title: 'Run local app and verify login plus core flows',
        risk: 'medium',
        dependsOn: ['oauth-dev', 'local-runtime'],
        generator: 'manual_checklist',
      },
      {
        key: 'no-secrets-commit',
        kind: 'validation',
        title: 'Confirm no secrets were committed to git or tickets',
        risk: 'high',
        dependsOn: ['smoke-test'],
        generator: 'manual_checklist',
      },
    ],
  },
  {
    slug: 'staging-environment-bootstrap',
    title: 'Bootstrap staging / dev environment',
    requiredInputs: ['projectId', 'environmentId'],
    overview: 'Rebuild or stand up a non-production environment from documented inventory links.',
    steps: [
      {
        key: 'scope-environment',
        kind: 'manual',
        title: 'Confirm target environment and linked assets',
        risk: 'low',
        generator: 'environment_scope',
      },
      {
        key: 'dns-hosting',
        kind: 'manual',
        title: 'Verify DNS and hosting dependencies',
        risk: 'medium',
        dependsOn: ['scope-environment'],
        generator: 'asset_by_type',
        assetType: 'domain',
      },
      {
        key: 'compute',
        kind: 'manual',
        title: 'Confirm compute / VPS or PaaS asset',
        risk: 'medium',
        dependsOn: ['scope-environment'],
        generator: 'asset_by_type',
        assetType: 'vps',
      },
      {
        key: 'storage',
        kind: 'reference',
        title: 'Document object storage and consumers',
        risk: 'medium',
        dependsOn: ['compute'],
        generator: 'asset_by_type',
        assetType: 'object_storage',
      },
      {
        key: 'mail-provider',
        kind: 'reference',
        title: 'Confirm transactional email provider metadata',
        risk: 'medium',
        dependsOn: ['scope-environment'],
        generator: 'asset_by_type',
        assetType: 'transactional_email',
      },
      {
        key: 'config-non-secret',
        kind: 'reference',
        title: 'List non-secret config entries for this environment',
        risk: 'low',
        dependsOn: ['scope-environment'],
        generator: 'config_entries',
      },
      {
        key: 'validation-handoff',
        kind: 'validation',
        title: 'Validate staging health checks and access roles',
        risk: 'medium',
        dependsOn: ['storage', 'mail-provider', 'config-non-secret'],
        generator: 'identities_roles',
      },
    ],
  },
  {
    slug: 'access-handover-checklist',
    title: 'Access handover (person or role change)',
    requiredInputs: ['projectId'],
    overview: 'Document who takes over accounts, emails, and asset roles when responsibility changes.',
    steps: [
      {
        key: 'identities-map',
        kind: 'manual',
        title: 'List identities and provider accounts involved',
        risk: 'low',
        generator: 'identities_overview',
      },
      {
        key: 'email-mailboxes',
        kind: 'manual',
        title: 'Update mailbox list in Hilko',
        risk: 'medium',
        dependsOn: ['identities-map'],
        generator: 'static_markdown',
        bodyMarkdown:
          'In [Emails & access](/accounts?tab=emails), add or relabel mailboxes for the incoming owner. Link each address to the assets that use it.',
      },
      {
        key: 'email-verify',
        kind: 'validation',
        title: 'Confirm mailbox ownership and recovery paths',
        risk: 'medium',
        dependsOn: ['email-mailboxes'],
        generator: 'emails_overview',
      },
      {
        key: 'asset-roles',
        kind: 'manual',
        title: 'Review asset roles and admin URLs',
        risk: 'medium',
        dependsOn: ['identities-map'],
        generator: 'identities_roles',
      },
      {
        key: 'vault-refs',
        kind: 'reference',
        title: 'Point to vault items (never paste secrets)',
        risk: 'high',
        dependsOn: ['asset-roles'],
        generator: 'vault_refs',
      },
      {
        key: 'transfer-checklist',
        kind: 'approval',
        title: 'Outgoing owner confirms handover complete',
        risk: 'high',
        dependsOn: ['vault-refs', 'email-verify'],
        generator: 'manual_checklist',
      },
    ],
  },
  {
    slug: 'registrar-contact-email-change',
    title: 'Change registrar / admin contact email',
    requiredInputs: ['projectId'],
    overview:
      'Structured checklist when a domain or hosting admin contact email changes—Hilko first, then the provider panel, then verification.',
    steps: [
      {
        key: 'verify-new-email',
        kind: 'validation',
        title: 'Confirm the new email is valid',
        risk: 'low',
        generator: 'static_markdown',
        bodyMarkdown:
          'Verify inbox access and policy (avoid shared inboxes unless documented). Note the address in execution notes.',
      },
      {
        key: 'hilko-email',
        kind: 'manual',
        title: 'Record the mailbox in Hilko',
        risk: 'low',
        dependsOn: ['verify-new-email'],
        generator: 'static_markdown',
        bodyMarkdown:
          'Open [Emails & access](/accounts?tab=emails), add the address, and link it to the domain or hosting asset.',
      },
      {
        key: 'registrar-panel',
        kind: 'manual',
        title: 'Update contact email at the registrar',
        risk: 'medium',
        dependsOn: ['hilko-email'],
        generator: 'asset_by_type',
        assetType: 'domain',
        providerSlug: 'namecheap',
        bodyMarkdown:
          'Open the registrar admin for the asset below. Set management / WHOIS contact email to the new address and save.',
      },
      {
        key: 'review-save',
        kind: 'validation',
        title: 'Review provider UI and document',
        risk: 'low',
        dependsOn: ['registrar-panel'],
        generator: 'static_markdown',
        bodyMarkdown:
          '- [ ] Provider shows the new email\n- [ ] Verification message received if required\n- [ ] Hilko inventory still matches reality',
      },
    ],
  },
  {
    slug: 'solo-founder-inventory-audit',
    title: 'Solo founder: inventory truth check',
    requiredInputs: ['projectId'],
    overview:
      'For a single operator: prove every asset lists your identity, your mailboxes, and vault pointers—no mystery “team” logins.',
    steps: [
      {
        key: 'solo-intro',
        kind: 'manual',
        title: 'Pick the identity you actually use day to day',
        risk: 'low',
        generator: 'static_markdown',
        bodyMarkdown:
          'In [Identities](/accounts?tab=identities), confirm one primary identity exists (your name or role). Archive or relabel stale “admin” placeholders.',
      },
      {
        key: 'solo-roles',
        kind: 'validation',
        title: 'Every asset role should be you',
        risk: 'medium',
        dependsOn: ['solo-intro'],
        generator: 'identities_roles',
      },
      {
        key: 'solo-emails',
        kind: 'manual',
        title: 'Mailboxes that reach you',
        risk: 'medium',
        dependsOn: ['solo-roles'],
        generator: 'static_markdown',
        bodyMarkdown:
          'Cross-check [Emails & access](/accounts?tab=emails) with provider notifications. Remove addresses you no longer monitor.',
      },
      {
        key: 'solo-emails-inventory',
        kind: 'validation',
        title: 'Generated mailbox list',
        risk: 'low',
        dependsOn: ['solo-emails'],
        generator: 'emails_overview',
      },
      {
        key: 'solo-verify-assets',
        kind: 'validation',
        title: 'Confirm control on unverified assets',
        risk: 'medium',
        dependsOn: ['solo-emails-inventory'],
        generator: 'static_markdown',
        bodyMarkdown:
          'Open [Assets needing confirmation](/assets?verification=needs_confirmation). Record how you proved control (metadata only).',
      },
      {
        key: 'solo-vault',
        kind: 'reference',
        title: 'Vault refs without pasting secrets',
        risk: 'high',
        dependsOn: ['solo-verify-assets'],
        generator: 'vault_refs',
      },
    ],
  },
  {
    slug: 'solo-vacation-handoff',
    title: 'Solo operator: vacation / break packet',
    requiredInputs: ['projectId'],
    overview:
      'Before you disconnect: a short checklist for the only admin—inventory, vault labels, and a runbook export for “future you” or a trusted helper.',
    steps: [
      {
        key: 'vacation-scope',
        kind: 'manual',
        title: 'What must stay up while you are away',
        risk: 'low',
        generator: 'inventory_overview',
      },
      {
        key: 'vacation-vault',
        kind: 'reference',
        title: 'Where break-glass credentials live',
        risk: 'high',
        dependsOn: ['vacation-scope'],
        generator: 'vault_refs',
      },
      {
        key: 'vacation-dns',
        kind: 'reference',
        title: 'DNS and domains that expire soon',
        risk: 'medium',
        dependsOn: ['vacation-scope'],
        generator: 'asset_by_type',
        assetType: 'domain',
      },
      {
        key: 'vacation-export',
        kind: 'manual',
        title: 'Export runbook for your backup person',
        risk: 'low',
        dependsOn: ['vacation-vault', 'vacation-dns'],
        generator: 'static_markdown',
        bodyMarkdown:
          'From any active runbook: **Export Markdown** and store in your password manager (link only in Hilko). Do not email the file.',
      },
      {
        key: 'vacation-close',
        kind: 'approval',
        title: 'I can be offline without surprises',
        risk: 'medium',
        dependsOn: ['vacation-export'],
        generator: 'static_markdown',
        bodyMarkdown:
          '- [ ] Billing domains checked\n- [ ] On-call alias documented\n- [ ] Helper knows Hilko login path (not shared password)',
      },
    ],
  },
  {
    slug: 'dns-cutover-checklist',
    title: 'DNS cutover to new host',
    requiredInputs: ['projectId', 'environmentId'],
    overview: 'Lower TTL, repoint DNS, validate dependents—without pasting secret zone files into Hilko.',
    steps: [
      {
        key: 'dns-prep',
        kind: 'manual',
        title: 'Lower TTL and note current records',
        risk: 'low',
        generator: 'static_markdown',
        bodyMarkdown:
          'Document public hostnames and targets in Hilko config entries (non-secret). Lower TTL at the DNS provider before the change window.',
      },
      {
        key: 'dns-asset',
        kind: 'manual',
        title: 'Open DNS provider',
        risk: 'high',
        dependsOn: ['dns-prep'],
        generator: 'asset_by_type',
        assetType: 'dns',
        providerSlug: 'cloudflare',
        bodyMarkdown: 'Use the admin URL on the asset below. Prepare the new A/AAAA/CNAME targets.',
      },
      {
        key: 'dns-deps',
        kind: 'validation',
        title: 'What depends on this DNS',
        risk: 'medium',
        dependsOn: ['dns-asset'],
        generator: 'asset_dependencies',
      },
      {
        key: 'dns-verify',
        kind: 'validation',
        title: 'Smoke-test after propagation',
        risk: 'high',
        dependsOn: ['dns-deps'],
        generator: 'static_markdown',
        bodyMarkdown:
          '- [ ] HTTP/TLS on primary hostname\n- [ ] Mail/auth not broken\n- [ ] Raise TTL after stable 24h',
      },
    ],
  },
]

export async function seedRunbookTemplates(db: NodePgDatabase<typeof schema>) {
  for (const tpl of TEMPLATES) {
    const existing = await db
      .select()
      .from(runbookTemplates)
      .where(eq(runbookTemplates.slug, tpl.slug))
      .limit(1)
    const schemaJson = {
      requiredInputs: tpl.requiredInputs,
      steps: tpl.steps,
    }
    if (existing[0]) {
      await db
        .update(runbookTemplates)
        .set({
          title: tpl.title,
          version: 1,
          schemaJson,
          contentMarkdown: tpl.overview,
        })
        .where(eq(runbookTemplates.id, existing[0].id))
    } else {
      await db.insert(runbookTemplates).values({
        slug: tpl.slug,
        title: tpl.title,
        version: 1,
        schemaJson,
        contentMarkdown: tpl.overview,
      })
    }
  }
}
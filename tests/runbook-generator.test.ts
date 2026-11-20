import { describe, expect, it } from 'vitest'
import { generateStepBody, generateStepsFromTemplate, type TemplateStepDef } from '../server/utils/runbooks/generator'
import type { RunbookGenContext } from '../server/utils/runbooks/context'

const emptyCtx: RunbookGenContext = {
  project: { id: 'p1', name: 'Northline', slug: 'northline-demo' },
  environment: { id: 'e1', name: 'Development', kind: 'development' },
  assets: [],
  vaultRefs: [],
  configEntries: [],
  identities: [],
  roles: [],
  emails: [],
  dependencies: [],
}

describe('runbook generator', () => {
  it('shows pending when repository asset missing', () => {
    const step: TemplateStepDef = {
      key: 'github',
      kind: 'manual',
      title: 'GitHub',
      risk: 'low',
      generator: 'asset_by_type',
      assetType: 'repository',
      providerSlug: 'github',
    }
    const { body, pending } = generateStepBody(step, emptyCtx)
    expect(pending).toBe(true)
    expect(body).toContain('Pending in inventory')
  })

  it('does not invent OAuth redirect URIs', () => {
    const steps: TemplateStepDef[] = [
      {
        key: 'oauth',
        kind: 'reference',
        title: 'OAuth',
        risk: 'medium',
        generator: 'asset_by_type',
        assetType: 'oauth_client',
      },
    ]
    const generated = generateStepsFromTemplate(steps, emptyCtx)
    expect(generated[0].bodyMarkdown).not.toMatch(/https?:\/\/[^\s]+callback/i)
    expect(generated[0].isPending).toBe(true)
  })

  it('lists assets when present', () => {
    const ctx: RunbookGenContext = {
      ...emptyCtx,
      assets: [
        {
          id: 'a1',
          name: 'GitHub repo 1',
          type: 'repository',
          adminUrl: 'https://github.com/org/repo',
          publicUrl: null,
          verificationStatus: 'declared',
          providerSlug: 'github',
          environmentId: 'e1',
        },
      ],
    }
    const step: TemplateStepDef = {
      key: 'github',
      kind: 'manual',
      title: 'GitHub',
      risk: 'low',
      generator: 'asset_by_type',
      assetType: 'repository',
    }
    const { body, pending } = generateStepBody(step, ctx)
    expect(pending).toBe(false)
    expect(body).toContain('GitHub repo 1')
  })
})
import { describe, expect, it } from 'vitest'
import { patchAssetSchema } from '../shared/schemas/inventory'

describe('patchAssetSchema', () => {
  it('accepts empty description and confirmed verification', () => {
    const parsed = patchAssetSchema.safeParse({
      name: 'AWS SES',
      type: 'transactional_email',
      description: null,
      adminUrl: '',
      publicUrl: '',
      verificationStatus: 'confirmed_by_human',
    })
    expect(parsed.success).toBe(true)
  })
})
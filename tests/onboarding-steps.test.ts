import { describe, expect, it } from 'vitest'
import { ONBOARDING_MAX_STEP } from '../shared/schemas/inventory'
import { ONBOARDING_MAX_STEP as APP_ONBOARDING_MAX_STEP } from '../app/constants/onboarding'

describe('onboarding step limits', () => {
  it('keeps client and API max step in sync', () => {
    expect(APP_ONBOARDING_MAX_STEP).toBe(ONBOARDING_MAX_STEP)
    expect(ONBOARDING_MAX_STEP).toBe(7)
  })
})
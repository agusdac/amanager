/** Onboarding tools step: dev/cloud first, Google cluster, AI last. */
const CATEGORY_RANK: Record<string, number> = {
  devtools: 10,
  cloud: 20,
  cdn: 30,
  hosting: 40,
  registrar: 50,
  mail: 60,
  google: 70,
  platform: 80,
  payments: 90,
  vault: 100,
  social: 110,
  design: 120,
  ai: 130,
  other: 999,
}

export function compareOnboardingProviderCategories(a: string, b: string) {
  return (CATEGORY_RANK[a] ?? 500) - (CATEGORY_RANK[b] ?? 500)
}
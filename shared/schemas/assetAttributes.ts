import { z } from 'zod'

/** Typed metadata in `assets.attributes_json` — public fields only, no secrets. */
export const assetAttributesSchema = z
  .object({
    ipv4: z.string().max(45).optional(),
    ipv6: z.string().max(45).optional(),
    hostname: z.string().max(253).optional(),
    /** Search Console / site verification — often same as project primary domain */
    siteDomain: z.string().max(253).optional(),
    region: z.string().max(120).optional(),
    planLabel: z.string().max(200).optional(),
    paymentAccountId: z.string().max(200).optional(),
    aiModelHint: z.string().max(200).optional(),
    designTeamId: z.string().max(200).optional(),
  })
  .partial()

export type AssetAttributes = z.infer<typeof assetAttributesSchema>

export function mergeAssetAttributes(
  existing: unknown,
  patch: AssetAttributes | undefined,
): AssetAttributes | null {
  if (!patch || Object.keys(patch).length === 0) {
    return (existing as AssetAttributes | null) ?? null
  }
  const base = assetAttributesSchema.safeParse(existing)
  const prev = base.success ? base.data : {}
  const merged = { ...prev, ...patch }
  for (const key of Object.keys(merged) as (keyof AssetAttributes)[]) {
    if (merged[key] === '' || merged[key] === undefined) delete merged[key]
  }
  return Object.keys(merged).length ? merged : null
}
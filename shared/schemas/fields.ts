import { z } from 'zod'

/** Trim strings; empty → `''` for URL fields, `undefined` for optional text. */
export function trimString(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'string') return value
  return value.trim()
}

/** Accepts empty string or a valid URL (metadata links only). */
export const optionalUrlField = z.preprocess(
  trimString,
  z.union([z.literal(''), z.string().url().max(2000)]),
)

/** Optional notes / description; empty clears to null in DB via API. */
export const optionalNullableText = z.preprocess(
  (v) => {
    if (v === undefined || v === null) return null
    if (typeof v !== 'string') return v
    const t = v.trim()
    return t === '' ? null : t
  },
  z.string().max(2000).nullable().optional(),
)
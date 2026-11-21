import { z } from 'zod'

export const ACTION_KINDS = ['command', 'checklist', 'reference'] as const
export type ActionKind = (typeof ACTION_KINDS)[number]

export const FAVORITE_TARGET_TYPES = ['asset', 'identity', 'email_address', 'action'] as const
export type FavoriteTargetType = (typeof FAVORITE_TARGET_TYPES)[number]

const anchorSchema = z
  .object({
    assetId: z.string().uuid().nullable().optional(),
    projectId: z.string().uuid().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.assetId && data.projectId) {
      ctx.addIssue({ code: 'custom', message: 'One anchor only', path: ['assetId'] })
    }
  })

export const createActionSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    bodyMarkdown: z.string().trim().min(1).max(32_000),
    pinned: z.boolean().optional(),
    kind: z.enum(ACTION_KINDS).nullable().optional(),
    assetId: z.string().uuid().nullable().optional(),
    projectId: z.string().uuid().nullable().optional(),
  })
  .and(anchorSchema)

export const updateActionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  bodyMarkdown: z.string().trim().min(1).max(32_000).optional(),
  pinned: z.boolean().optional(),
  kind: z.enum(ACTION_KINDS).nullable().optional(),
  assetId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
})

export const createFavoriteSchema = z.object({
  targetType: z.enum(FAVORITE_TARGET_TYPES),
  targetId: z.string().uuid(),
})

export const reorderFavoritesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        position: z.number().int().min(0),
      }),
    )
    .min(1),
})

export type CreateActionInput = z.infer<typeof createActionSchema>
export type UpdateActionInput = z.infer<typeof updateActionSchema>
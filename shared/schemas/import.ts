import { z } from 'zod'

const importTargetSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('workspace') }),
  z.object({ mode: z.literal('project'), projectId: z.string().uuid() }),
  z.object({ mode: z.literal('new_project'), newProjectName: z.string().min(1).max(200) }),
])

export const importPreviewBodySchema = z.object({
  csv: z.string().max(2_000_000).optional(),
  zipBase64: z.string().max(8_000_000).optional(),
  columnMap: z.record(z.string(), z.string()).optional(),
  target: importTargetSchema.optional(),
})

export const importCommitBodySchema = z.object({
  previewId: z.string().uuid(),
  resolutions: z
    .array(
      z.object({
        duplicateId: z.string(),
        action: z.enum(['skip', 'merge', 'duplicate']),
      }),
    )
    .default([]),
})

export const legacyCsvImportSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
})
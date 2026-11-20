import { z } from 'zod'

export const projectCopyPreviewSchema = z.object({
  targetWorkspaceId: z.string().uuid(),
})

export const projectCopyCommitSchema = z.object({
  targetWorkspaceId: z.string().uuid(),
  selectedRowIds: z.array(z.string()),
  confirmFlagged: z.boolean().optional(),
})
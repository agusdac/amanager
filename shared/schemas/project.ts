import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url().max(2000).optional().or(z.literal('')),
})

export const createAssetSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(80),
  adminUrl: z.string().url().max(2000).optional().or(z.literal('')),
  publicUrl: z.string().url().max(2000).optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
})
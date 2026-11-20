import { z } from 'zod'

export const workspaceRoleSchema = z.enum(['viewer', 'editor', 'admin', 'owner'])

export const createTeamWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
})

export const renameWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
})

export const inviteMemberSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(['viewer', 'editor', 'admin']),
})

export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
})

export const acceptInviteSchema = z.object({
  token: z.string().min(16).max(128),
})

export const switchWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
})
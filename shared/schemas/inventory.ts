import { z } from 'zod'

export const relationTypes = [
  'depends_on',
  'hosted_on',
  'deployed_from',
  'authenticated_by',
  'stores_data_in',
  'sends_email_via',
  'domain_registered_at',
  'dns_managed_by',
  'verified_with',
  'publishes_to',
  'billed_through',
  'recovery_depends_on',
  'other',
] as const

export const createIdentitySchema = z.object({
  label: z.string().min(1).max(200),
  providerId: z.string().uuid().optional().nullable(),
  principalType: z.string().max(80).optional(),
  authMethod: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
})

export const createEmailSchema = z.object({
  address: z.string().email().max(320),
  label: z.string().max(200).optional(),
  mailboxType: z.string().max(80).optional(),
  purposes: z
    .array(
      z.object({
        identityId: z.string().uuid().optional(),
        purpose: z.string().max(80),
      }),
    )
    .optional(),
})

export const createProviderAccountSchema = z.object({
  label: z.string().min(1).max(200),
  providerId: z.string().uuid().optional().nullable(),
  accountIdentifier: z.string().max(200).optional(),
})

export const createEnvironmentSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: z.enum(['production', 'development', 'staging', 'other']),
})

export const createAssetFullSchema = z.object({
  projectId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(80),
  providerId: z.string().uuid().optional().nullable(),
  providerAccountId: z.string().uuid().optional().nullable(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  adminUrl: z.string().url().max(2000).optional().or(z.literal('')),
  publicUrl: z.string().url().max(2000).optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  externalIdentifier: z.string().max(500).optional(),
  verificationStatus: z.enum(['unverified', 'declared', 'confirmed_by_human']).optional(),
})

export const patchAssetSchema = createAssetFullSchema.partial().omit({ projectId: true })

export const createDependencySchema = z.object({
  fromAssetId: z.string().uuid(),
  toAssetId: z.string().uuid(),
  relationType: z.enum(relationTypes),
  description: z.string().max(2000).optional(),
})

export const createAssetRoleSchema = z.object({
  assetId: z.string().uuid(),
  identityId: z.string().uuid(),
  roleType: z.string().min(1).max(80),
  providerRoleLabel: z.string().max(200).optional(),
})

export const createVaultRefSchema = z.object({
  assetId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  label: z.string().min(1).max(200),
  locationHint: z.string().min(1).max(500),
  vaultProvider: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
})

export const onboardingDraftSchema = z.object({
  step: z.number().int().min(1).max(5),
  payload: z.record(z.string(), z.unknown()),
})

export const csvImportSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
})
import { z } from 'zod'

export const ASSET_TYPE_KEYS = [
  'service',
  'domain',
  'hosting',
  'repository',
  'dns',
  'email',
  'oauth_client',
  'youtube_channel',
  'search_console',
  'google_ads',
  'vps',
  'mail_hosting',
  'object_storage',
  'transactional_email',
  'other',
] as const

export const VERIFICATION_METHOD_KEYS = [
  'dns_txt',
  'html_file',
  'meta_tag',
  'cname',
  'registrar_lock',
  'provider_console',
  'manual_check',
  'other',
] as const

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

const accessRoleTypes = ['owner', 'admin', 'operator', 'developer', 'billing', 'viewer', 'other'] as const

export const createAssetFullSchema = z.object({
  projectId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(80),
  providerId: z.string().uuid().optional().nullable(),
  providerSlug: z.string().max(80).optional().nullable(),
  providerAccountId: z.string().uuid().optional().nullable(),
  identityId: z.string().uuid().optional().nullable(),
  accessRoleType: z.enum(accessRoleTypes).optional(),
  loginEmail: z.string().email().max(320).optional().or(z.literal('')),
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

export const configValueTypes = ['string', 'url', 'boolean'] as const

export const createConfigEntrySchema = z
  .object({
    assetId: z.string().uuid(),
    projectId: z.string().uuid().optional().nullable(),
    key: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    valueType: z.enum(configValueTypes).optional(),
    publicValue: z.string().max(2000).optional(),
    isSensitiveReference: z.boolean().optional(),
  })
  .refine((data) => !data.isSensitiveReference || !data.publicValue?.trim(), {
    message: 'Sensitive keys must not store a public value',
  })

export const onboardingDraftSchema = z.object({
  step: z.number().int().min(1).max(5),
  payload: z.record(z.string(), z.unknown()),
})

export const csvImportSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
})

export const createVerificationSchema = z.object({
  sourceType: z.literal('asset'),
  sourceId: z.string().uuid(),
  method: z.enum(VERIFICATION_METHOD_KEYS),
  evidenceNote: z.string().max(2000).optional(),
  status: z.enum(['declared', 'confirmed_by_human', 'unverified']).optional(),
})
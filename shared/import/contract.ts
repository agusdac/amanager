export const IMPORT_FORMAT_VERSION = 1

export const BUNDLE_FILES = [
  'manifest.json',
  'assets.csv',
  'projects.csv',
  'environments.csv',
  'emails.csv',
  'identities.csv',
  'asset_emails.csv',
  'identity_emails.csv',
  'dependencies.csv',
  'config_entries.csv',
  'vault_references.csv',
] as const

export const ASSET_CANONICAL_HEADERS = [
  'project',
  'project_slug',
  'provider',
  'asset_type',
  'asset_name',
  'asset_key',
  'external_id',
  'login_email',
  'environment',
  'admin_url',
  'public_url',
  'notes',
  'verification_status',
] as const

export type ImportTarget =
  | { mode: 'workspace' }
  | { mode: 'project'; projectId: string }
  | { mode: 'new_project'; newProjectName: string }

export type DuplicateResolutionAction = 'skip' | 'merge' | 'duplicate'

export type ImportPreviewDuplicate = {
  id: string
  rowIndex: number
  matchKey: string
  existingAssetId: string
  existingName: string
  mergeDiff?: Record<string, { from: string | null; to: string }>
}
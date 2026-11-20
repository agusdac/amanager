import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  uniqueIndex,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  locale: text('locale').notNull().default('en'),
  theme: text('theme').notNull().default('light'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  activeWorkspaceId: uuid('active_workspace_id').references(() => workspaces.id, {
    onDelete: 'set null',
  }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.userId] })],
)

export const workspaceInvites = pgTable(
  'workspace_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    invitedByUserId: uuid('invited_by_user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('workspace_invites_workspace_email_idx').on(table.workspaceId, table.email)],
)

/** Global catalog (system seed). */
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category'),
  websiteUrl: text('website_url'),
  isSystem: boolean('is_system').notNull().default(true),
})

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id').references(() => clients.id),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    websiteUrl: text('website_url'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('projects_workspace_slug_idx').on(table.workspaceId, table.slug)],
)

export const projectEnvironments = pgTable('project_environments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const identities = pgTable('identities', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').references(() => providers.id),
  label: text('label').notNull(),
  principalType: text('principal_type').notNull().default('person'),
  authMethod: text('auth_method').notNull().default('unknown'),
  status: text('status').notNull().default('active'),
  verificationStatus: text('verification_status').notNull().default('declared'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const emailAddresses = pgTable(
  'email_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    label: text('label'),
    mailboxType: text('mailbox_type'),
    verificationStatus: text('verification_status').notNull().default('declared'),
    /** Deep link to vault item (metadata only — never a password). */
    passwordManagerItemUrl: text('password_manager_item_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('email_workspace_address_idx').on(table.workspaceId, table.address)],
)

export const identityEmails = pgTable('identity_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  identityId: uuid('identity_id')
    .notNull()
    .references(() => identities.id, { onDelete: 'cascade' }),
  emailId: uuid('email_id')
    .notNull()
    .references(() => emailAddresses.id, { onDelete: 'cascade' }),
  purpose: text('purpose').notNull(),
})

export const providerAccounts = pgTable('provider_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').references(() => providers.id),
  label: text('label').notNull(),
  accountIdentifier: text('account_identifier'),
  status: text('status').notNull().default('active'),
  verificationStatus: text('verification_status').notNull().default('declared'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const providerAccountIdentities = pgTable('provider_account_identities', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => providerAccounts.id, { onDelete: 'cascade' }),
  identityId: uuid('identity_id')
    .notNull()
    .references(() => identities.id, { onDelete: 'cascade' }),
  roleLabel: text('role_label'),
})

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').references(() => providers.id),
  providerAccountId: uuid('provider_account_id').references(() => providerAccounts.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  criticality: text('criticality').notNull().default('medium'),
  externalIdentifier: text('external_identifier'),
  adminUrl: text('admin_url'),
  publicUrl: text('public_url'),
  description: text('description'),
  verificationStatus: text('verification_status').notNull().default('declared'),
  source: text('source').notNull().default('manual'),
  importBatchId: uuid('import_batch_id'),
  attributesJson: jsonb('attributes_json'),
  /** Bitwarden/1Password item URL or URI scheme — metadata only. */
  passwordManagerItemUrl: text('password_manager_item_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projectAssets = pgTable(
  'project_assets',
  {
    workspaceId: uuid('workspace_id').notNull(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    environmentId: uuid('environment_id').references(() => projectEnvironments.id),
    purpose: text('purpose'),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.assetId] })],
)

export const assetRoles = pgTable('asset_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'cascade' }),
  identityId: uuid('identity_id').references(() => identities.id),
  roleType: text('role_type').notNull(),
  providerRoleLabel: text('provider_role_label'),
  verificationStatus: text('verification_status').notNull().default('declared'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const assetEmails = pgTable('asset_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'cascade' }),
  emailId: uuid('email_id')
    .notNull()
    .references(() => emailAddresses.id, { onDelete: 'cascade' }),
  purpose: text('purpose').notNull(),
  passwordManagerItemUrl: text('password_manager_item_url'),
})

export const assetDependencies = pgTable(
  'asset_dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    fromAssetId: uuid('from_asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    toAssetId: uuid('to_asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    relationType: text('relation_type').notNull(),
    description: text('description'),
    verificationStatus: text('verification_status').notNull().default('declared'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('asset_dep_unique').on(
      table.workspaceId,
      table.fromAssetId,
      table.toAssetId,
      table.relationType,
    ),
  ],
)

export const configEntries = pgTable('config_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  assetId: uuid('asset_id').references(() => assets.id),
  key: text('key').notNull(),
  description: text('description'),
  valueType: text('value_type').notNull().default('string'),
  publicValue: text('public_value'),
  isSensitiveReference: boolean('is_sensitive_reference').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const vaultReferences = pgTable('vault_references', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  assetId: uuid('asset_id').references(() => assets.id),
  label: text('label').notNull(),
  vaultProvider: text('vault_provider').notNull().default('bitwarden'),
  locationHint: text('location_hint').notNull(),
  itemUrl: text('item_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: uuid('source_id').notNull(),
  status: text('status').notNull(),
  evidenceNote: text('evidence_note'),
  assigneeUserId: uuid('assignee_user_id').references(() => users.id, { onDelete: 'set null' }),
  checkedAt: timestamp('checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const onboardingDrafts = pgTable('onboarding_drafts', {
  workspaceId: uuid('workspace_id')
    .primaryKey()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  step: integer('step').notNull().default(1),
  payloadJson: jsonb('payload_json').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('committed'),
  rowCount: integer('row_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  action: text('action').notNull(),
  safeDiffJson: jsonb('safe_diff_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/** System catalog (workspace_id null) or workspace-owned reusable templates. */
export const runbookTemplates = pgTable('runbook_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  version: integer('version').notNull().default(1),
  title: text('title').notNull(),
  schemaJson: jsonb('schema_json').notNull(),
  contentMarkdown: text('content_markdown'),
})

export const runbooks = pgTable('runbooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  environmentId: uuid('environment_id').references(() => projectEnvironments.id),
  templateId: uuid('template_id').references(() => runbookTemplates.id),
  templateSlug: text('template_slug'),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'),
  overviewMarkdown: text('overview_markdown'),
  instanceVersion: integer('instance_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const runbookSteps = pgTable(
  'runbook_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    runbookId: uuid('runbook_id')
      .notNull()
      .references(() => runbooks.id, { onDelete: 'cascade' }),
    stepKey: text('step_key').notNull(),
    position: integer('position').notNull(),
    kind: text('kind').notNull().default('manual'),
    title: text('title').notNull(),
    bodyMarkdown: text('body_markdown').notNull().default(''),
    risk: text('risk').notNull().default('low'),
    dependsOnJson: jsonb('depends_on_json').notNull().default([]),
    isRequired: boolean('is_required').notNull().default(true),
    source: text('source').notNull().default('generated'),
    hiddenAt: timestamp('hidden_at', { withTimezone: true }),
    defaultAssigneeUserId: uuid('default_assignee_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('runbook_steps_key_idx').on(table.runbookId, table.stepKey)],
)

export const runbookExecutions = pgTable('runbook_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  runbookId: uuid('runbook_id')
    .notNull()
    .references(() => runbooks.id, { onDelete: 'cascade' }),
  startedBy: uuid('started_by')
    .notNull()
    .references(() => users.id),
  status: text('status').notNull().default('in_progress'),
  contentBinding: text('content_binding').notNull().default('snapshot'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const runbookExecutionSteps = pgTable('runbook_execution_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  executionId: uuid('execution_id')
    .notNull()
    .references(() => runbookExecutions.id, { onDelete: 'cascade' }),
  stepKey: text('step_key').notNull(),
  position: integer('position').notNull(),
  kind: text('kind').notNull().default('manual'),
  title: text('title').notNull(),
  bodyMarkdown: text('body_markdown').notNull().default(''),
  risk: text('risk').notNull().default('low'),
  dependsOnJson: jsonb('depends_on_json').notNull().default([]),
    originStepId: uuid('origin_step_id').references(() => runbookSteps.id),
    assigneeUserId: uuid('assignee_user_id').references(() => users.id, { onDelete: 'set null' }),
})

export const runbookStepResults = pgTable('runbook_step_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  executionId: uuid('execution_id')
    .notNull()
    .references(() => runbookExecutions.id, { onDelete: 'cascade' }),
  executionStepId: uuid('execution_step_id').references(() => runbookExecutionSteps.id, {
    onDelete: 'cascade',
  }),
  runbookStepId: uuid('runbook_step_id').references(() => runbookSteps.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('todo'),
  resultNote: text('result_note'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
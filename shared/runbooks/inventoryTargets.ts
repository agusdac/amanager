export const INVENTORY_TARGET_TYPES = ['asset', 'identity', 'email', 'vault_ref', 'config_entry'] as const
export type InventoryTargetType = (typeof INVENTORY_TARGET_TYPES)[number]

export const WORKSPACE_INVENTORY_GENERATORS = [
  'inventory_overview',
  'environment_scope',
  'asset_by_type',
  'vault_refs',
  'config_entries',
  'identities_roles',
  'identities_overview',
  'emails_overview',
  'asset_dependencies',
] as const

export type WorkspaceInventoryGenerator = (typeof WORKSPACE_INVENTORY_GENERATORS)[number]

export function generatorSupportsSpecificTarget(gen: string): boolean {
  return generatorDefaultTargetType(gen) !== null
}

export function generatorDefaultTargetType(gen: string): InventoryTargetType | null {
  switch (gen) {
    case 'inventory_overview':
    case 'asset_by_type':
      return 'asset'
    case 'identities_overview':
    case 'identities_roles':
      return 'identity'
    case 'emails_overview':
      return 'email'
    case 'vault_refs':
      return 'vault_ref'
    case 'config_entries':
      return 'config_entry'
    default:
      return null
  }
}
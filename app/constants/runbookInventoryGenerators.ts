export {
  WORKSPACE_INVENTORY_GENERATORS,
  generatorDefaultTargetType,
  generatorSupportsSpecificTarget,
  type InventoryTargetType,
  type WorkspaceInventoryGenerator,
} from '../../shared/runbooks/inventoryTargets'

export function inventoryGeneratorNeedsAssetType(gen: string) {
  return gen === 'asset_by_type'
}
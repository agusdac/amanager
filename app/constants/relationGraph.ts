/** Muted stroke colors for dependency edges (stone-friendly palette). */
export const RELATION_EDGE_COLORS: Record<string, string> = {
  depends_on: '#57534e',
  hosted_on: '#b45309',
  deployed_from: '#0369a1',
  authenticated_by: '#6d28d9',
  verified_with: '#047857',
  stores_data_in: '#c2410c',
  sends_email_via: '#0e7490',
  domain_registered_at: '#7c3aed',
  dns_managed_by: '#4f46e5',
  publishes_to: '#15803d',
  billed_through: '#a16207',
  recovery_depends_on: '#be123c',
  other: '#78716c',
}

export function relationEdgeColor(relationType: string): string {
  return RELATION_EDGE_COLORS[relationType] ?? '#a8a29e'
}
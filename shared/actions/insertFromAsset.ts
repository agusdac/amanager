import type { AssetAttributes } from '../schemas/assetAttributes'

type AssetSnippet = {
  name: string
  adminUrl?: string | null
  publicUrl?: string | null
  attributesJson?: AssetAttributes | null
}

/** Literal lines for “Insertar del activo” — no template engine. */
export function buildAssetInsertLines(asset: AssetSnippet): string {
  const lines: string[] = [`**${asset.name.trim()}**`]
  if (asset.adminUrl?.trim()) lines.push(`Admin: ${asset.adminUrl.trim()}`)
  if (asset.publicUrl?.trim()) lines.push(`Public: ${asset.publicUrl.trim()}`)
  const attrs = asset.attributesJson ?? {}
  const host = attrs.hostname ?? attrs.ipv4 ?? attrs.host
  if (typeof host === 'string' && host.trim()) lines.push(`Host: ${host.trim()}`)
  return lines.join('\n')
}
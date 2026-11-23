import JSZip from 'jszip'
import { IMPORT_FORMAT_VERSION } from '../../shared/import/contract'
import type { CsvRow } from './csv'
import { parseCsvAuto, toCsv } from './csv'

export type ParsedBundle = {
  manifest: { formatVersion: number }
  csvFiles: Record<string, string>
  assets: { headers: string[]; rows: CsvRow[] }
  extras: Record<string, { headers: string[]; rows: CsvRow[] }>
}

export async function parseZipBase64(zipBase64: string): Promise<Record<string, string>> {
  const buf = Buffer.from(zipBase64, 'base64')
  const zip = await JSZip.loadAsync(buf)
  const out: Record<string, string> = {}
  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue
    const base = name.split('/').pop() ?? name
    out[base] = await file.async('string')
  }
  return out
}

export function parseBundleFromCsvOnly(csv: string): Record<string, string> {
  return { 'assets.csv': csv }
}

export function applyColumnMap(headers: string[], rows: CsvRow[], columnMap?: Record<string, string>) {
  if (!columnMap || !Object.keys(columnMap).length) return { headers, rows }
  const remappedHeaders = headers.map((h) => {
    const mapped = columnMap[h]?.trim()
    return mapped || h
  })
  const newRows = rows.map((row) => {
    const next: CsvRow = {}
    headers.forEach((h, i) => {
      const canon = remappedHeaders[i] ?? h
      next[canon] = row[h] ?? ''
    })
    return next
  })
  return { headers: remappedHeaders, rows: newRows }
}

export function parseBundleFiles(
  files: Record<string, string>,
  columnMap?: Record<string, string>,
): ParsedBundle {
  let manifest = { formatVersion: IMPORT_FORMAT_VERSION }
  if (files['manifest.json']) {
    try {
      const parsed = JSON.parse(files['manifest.json']) as { formatVersion?: number }
      if (parsed.formatVersion) manifest = { formatVersion: parsed.formatVersion }
    } catch {
      /* default manifest */
    }
  }
  if (manifest.formatVersion !== IMPORT_FORMAT_VERSION) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported bundle formatVersion ${manifest.formatVersion}`,
    })
  }

  const assetsText = files['assets.csv']
  if (!assetsText?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Bundle must include assets.csv' })
  }

  const assetsParsed = parseCsvAuto(assetsText)
  const mapped = applyColumnMap(assetsParsed.headers, assetsParsed.rows, columnMap)

  const extras: ParsedBundle['extras'] = {}
  for (const name of Object.keys(files)) {
    if (!name.endsWith('.csv') || name === 'assets.csv') continue
    const p = parseCsvAuto(files[name]!)
    extras[name] = { headers: p.headers, rows: p.rows }
  }

  return {
    manifest,
    csvFiles: files,
    assets: mapped,
    extras,
  }
}

export async function buildInventoryZip(files: Record<string, string>): Promise<Uint8Array> {
  const zip = new JSZip()
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content)
  }
  return zip.generateAsync({ type: 'uint8array' })
}

export function emptyTemplateFiles(): Record<string, string> {
  const assetHeaders = [
    'project',
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
  ]
  const depHeaders = ['from_asset_key', 'to_asset_key', 'relation_type', 'description']
  return {
    'manifest.json': JSON.stringify({ formatVersion: IMPORT_FORMAT_VERSION }, null, 2),
    'assets.csv': toCsv(assetHeaders, []),
    'dependencies.csv': toCsv(depHeaders, []),
    'emails.csv': toCsv(['email_address', 'label'], []),
    'identities.csv': toCsv(['identity_key', 'label', 'login_email'], []),
  }
}
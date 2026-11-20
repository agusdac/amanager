import { csvImportSchema } from '../../../shared/schemas/inventory'
import { parseCsv } from '../../utils/csv'
import { scanCsvHeaders, rowHasSuspiciousSecret } from '../../utils/secret-scan'
import { requireSession } from '../../utils/session'
import { requireEditor } from '../../utils/workspace-role'

const EXPECTED_HEADERS = [
  'project',
  'provider',
  'asset_type',
  'asset_name',
  'login_email',
  'environment',
  'admin_url',
  'notes',
]

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  requireEditor(session)
  const body = await readBody(event)
  const parsed = csvImportSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

  const { headers, rows } = parseCsv(parsed.data.csv)
  const headerScan = scanCsvHeaders(headers)

  const rejectedRows: number[] = []
  const preview = rows.slice(0, 50).map((row, idx) => {
    if (rowHasSuspiciousSecret(row)) rejectedRows.push(idx + 2)
    return row
  })

  return {
    ok: headerScan.ok && rejectedRows.length === 0,
    rejectedColumns: headerScan.rejected,
    rejectedRowNumbers: rejectedRows,
    headers,
    expectedHeaders: EXPECTED_HEADERS,
    preview,
    totalRows: rows.length,
  }
})
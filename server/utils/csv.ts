export type CsvRow = Record<string, string>

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = splitCsvLine(lines[0])
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const row: CsvRow = {}
    headers.forEach((h, idx) => {
      row[h.trim()] = (cells[idx] ?? '').trim()
    })
    rows.push(row)
  }
  return { headers, rows }
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(current)
      current = ''
      continue
    }
    current += ch
  }
  out.push(current)
  return out
}

export function toCsv(headers: string[], rows: CsvRow[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const head = headers.map(esc).join(',')
  const body = rows.map((r) => headers.map((h) => esc(r[h] ?? '')).join(',')).join('\n')
  return `${head}\n${body}`
}
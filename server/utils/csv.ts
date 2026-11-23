export type CsvRow = Record<string, string>

export function detectCsvDelimiter(firstLine: string): ',' | ';' {
  let commas = 0
  let semis = 0
  let inQuotes = false
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes
    else if (!inQuotes) {
      if (ch === ',') commas++
      if (ch === ';') semis++
    }
  }
  return semis > commas ? ';' : ','
}

export function parseCsv(text: string, delimiter = ','): { headers: string[]; rows: CsvRow[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = splitCsvLine(lines[0], delimiter)
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter)
    const row: CsvRow = {}
    headers.forEach((h, idx) => {
      row[h.trim()] = (cells[idx] ?? '').trim()
    })
    rows.push(row)
  }
  return { headers, rows }
}

export function parseCsvAuto(text: string): { headers: string[]; rows: CsvRow[]; delimiter: ',' | ';' } {
  const trimmed = text.trim()
  if (!trimmed) return { headers: [], rows: [], delimiter: ',' }
  const first = trimmed.split(/\r?\n/).find(Boolean) ?? ''
  const delimiter = detectCsvDelimiter(first)
  const parsed = parseCsv(trimmed, delimiter)
  return { ...parsed, delimiter }
}

function splitCsvLine(line: string, delimiter = ','): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === delimiter && !inQuotes) {
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
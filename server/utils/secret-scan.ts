const FORBIDDEN_COLUMNS = [
  /^password$/i,
  /^secret$/i,
  /^api[_-]?key$/i,
  /^token$/i,
  /^private[_-]?key$/i,
  /^ssh[_-]?key$/i,
  /^client[_-]?secret$/i,
  /^access[_-]?token$/i,
  /^refresh[_-]?token$/i,
]

const SUSPICIOUS_VALUE = /^(sk_|pk_live_|AKIA|-----BEGIN)/

export function scanCsvHeaders(headers: string[]): { ok: boolean; rejected: string[] } {
  const rejected = headers.filter((h) => FORBIDDEN_COLUMNS.some((re) => re.test(h.trim())))
  return { ok: rejected.length === 0, rejected }
}

export function rowHasSuspiciousSecret(values: Record<string, string>): boolean {
  for (const [key, val] of Object.entries(values)) {
    if (FORBIDDEN_COLUMNS.some((re) => re.test(key.trim()))) return true
    if (val && SUSPICIOUS_VALUE.test(val.trim())) return true
  }
  return false
}

export function scanTextFields(fields: Record<string, string | null | undefined>): string | null {
  for (const [key, raw] of Object.entries(fields)) {
    const val = raw?.trim()
    if (!val) continue
    if (FORBIDDEN_COLUMNS.some((re) => re.test(key.trim()))) return key
    if (SUSPICIOUS_VALUE.test(val)) return key
    if (rowHasSuspiciousSecret({ [key]: val })) return key
  }
  return null
}
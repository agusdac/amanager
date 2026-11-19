type ErrorData = {
  fields?: Record<string, string[]>
  formErrors?: string[]
  hint?: string
  stack?: string[]
  context?: string
}

type H3Body = {
  statusMessage?: string
  message?: string
  data?: ErrorData
}

export function formatApiError(err: unknown): string {
  const e = err as {
    statusMessage?: string
    message?: string
    data?: H3Body | ErrorData
  }

  const parts: string[] = []

  const body = e.data as H3Body | undefined
  const nested = body && 'data' in body && body.data ? body.data : (e.data as ErrorData | undefined)

  const statusMsg = e.statusMessage ?? body?.statusMessage ?? body?.message
  if (statusMsg) parts.push(statusMsg)

  if (nested?.formErrors?.length) parts.push(...nested.formErrors)
  if (nested?.fields) {
    for (const [field, messages] of Object.entries(nested.fields)) {
      if (messages?.length) parts.push(`${field}: ${messages.join(', ')}`)
    }
  }
  if (import.meta.dev && nested?.context) {
    parts.push(`(${nested.context})`)
  }
  if (import.meta.dev && nested?.hint) {
    parts.push(nested.hint)
  }

  return parts.filter(Boolean).join(' · ') || (e.message ?? 'Request failed')
}
/** Client-safe subset of runbook Markdown (no raw HTML). */

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeHref(href: string): string | null {
  const trimmed = href.trim()
  if (trimmed.startsWith('/')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return null
}

function inlineFormat(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, '<code class="rounded bg-stone-100 px-1 text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
      const safe = safeHref(href)
      if (!safe) return label
      return `<a href="${safe}" class="font-medium text-stone-900 underline">${label}</a>`
    })
}

export function renderMarkdownPreview(md: string): string {
  if (!md.trim()) return ''

  const lines = md.split('\n')
  const out: string[] = []
  let inUl = false

  const closeUl = () => {
    if (inUl) {
      out.push('</ul>')
      inUl = false
    }
  }

  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (!trimmed) {
      closeUl()
      out.push('<br />')
      continue
    }
    if (trimmed.startsWith('> ')) {
      closeUl()
      const inner = inlineFormat(escapeHtml(trimmed.slice(2)))
      out.push(`<blockquote class="border-l-4 border-amber-300 bg-amber-50/60 px-3 py-2 text-sm">${inner}</blockquote>`)
      continue
    }
    if (trimmed.startsWith('- ')) {
      if (!inUl) {
        out.push('<ul class="list-disc space-y-1 pl-5 text-sm">')
        inUl = true
      }
      out.push(`<li>${inlineFormat(escapeHtml(trimmed.slice(2)))}</li>`)
      continue
    }
    closeUl()
    out.push(`<p class="text-sm leading-relaxed">${inlineFormat(escapeHtml(trimmed))}</p>`)
  }
  closeUl()

  return out.join('\n')
}
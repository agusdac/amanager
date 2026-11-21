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
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
      const safe = safeHref(href)
      if (!safe) return label
      return `<a href="${safe}">${label}</a>`
    })
}

export function renderMarkdownPreview(md: string): string {
  if (!md.trim()) return ''

  const lines = md.split('\n')
  const out: string[] = []
  let inUl = false
  let inTaskUl = false

  const closeUl = () => {
    if (inUl) {
      out.push('</ul>')
      inUl = false
    }
    if (inTaskUl) {
      out.push('</ul>')
      inTaskUl = false
    }
  }

  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (!trimmed) {
      closeUl()
      out.push('<br />')
      continue
    }
    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      closeUl()
      const level = Math.min(heading[1]!.length, 6)
      const inner = inlineFormat(escapeHtml(heading[2]!))
      out.push(
        `<h${level} class="font-semibold text-ink ${level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm'} mt-3 first:mt-0">${inner}</h${level}>`,
      )
      continue
    }
    if (trimmed.startsWith('> ')) {
      closeUl()
      const inner = inlineFormat(escapeHtml(trimmed.slice(2)))
      out.push(`<blockquote class="markdown-quote">${inner}</blockquote>`)
      continue
    }
    const task = trimmed.match(/^- \[([ xX])\]\s+(.*)$/)
    if (task) {
      if (!inTaskUl) {
        closeUl()
        out.push('<ul class="space-y-1 pl-1 text-sm">')
        inTaskUl = true
      }
      const done = task[1]!.toLowerCase() === 'x'
      const box = done ? '☑' : '☐'
      out.push(
        `<li class="flex gap-2"><span class="shrink-0 text-subtle" aria-hidden="true">${box}</span><span>${inlineFormat(escapeHtml(task[2]!))}</span></li>`,
      )
      continue
    }
    if (trimmed.startsWith('- ')) {
      if (!inUl) {
        closeUl()
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
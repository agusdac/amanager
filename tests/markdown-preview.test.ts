import { describe, expect, it } from 'vitest'
import { renderMarkdownPreview } from '../shared/markdown/preview'

describe('renderMarkdownPreview', () => {
  it('escapes script tags', () => {
    const html = renderMarkdownPreview('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renders safe relative links', () => {
    const html = renderMarkdownPreview('[Asset](/assets/abc)')
    expect(html).toContain('href="/assets/abc"')
  })

  it('blocks javascript links', () => {
    const html = renderMarkdownPreview('[x](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })
})
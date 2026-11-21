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

  it('renders bullet lists', () => {
    const html = renderMarkdownPreview('- alpha\n- beta')
    expect(html).toContain('<ul')
    expect(html).toContain('alpha')
    expect(html).toContain('beta')
  })

  it('renders headings', () => {
    const html = renderMarkdownPreview('## Notes')
    expect(html).toContain('<h2')
    expect(html).toContain('Notes')
  })
})
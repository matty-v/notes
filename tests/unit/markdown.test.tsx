import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { renderMarkdown } from '@/lib/markdown'

describe('renderMarkdown - single-newline soft breaks', () => {
  it('renders single newlines as <br>', () => {
    const { container } = render(<>{renderMarkdown('line one\nline two\nline three')}</>)
    const brs = container.querySelectorAll('br')
    expect(brs.length).toBeGreaterThanOrEqual(2)
  })

  it('renders double newlines as separate paragraphs', () => {
    const { container } = render(<>{renderMarkdown('para one\n\npara two')}</>)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(2)
  })

  it('linkifies plain URLs exactly once (no double-linking from GFM + regex)', () => {
    const { container } = render(<>{renderMarkdown('Visit https://example.com today')}</>)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', 'https://example.com')
  })

  it('rejects javascript: URLs in markdown links', () => {
    const { container } = render(<>{renderMarkdown('[click](javascript:alert(1))')}</>)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(0)
  })
})

describe('renderMarkdown - nested list rendering', () => {
  it('renders depth-1 nesting: parent with indented children', () => {
    const md = '- parent\n  - child A\n  - child B'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const topUl = container.querySelector('ul')
    expect(topUl).toBeInTheDocument()
    const nestedUl = topUl!.querySelector('ul')
    expect(nestedUl).toBeInTheDocument()
    expect(nestedUl!.children).toHaveLength(2)
    expect(nestedUl!.children[0]).toHaveTextContent('child A')
    expect(nestedUl!.children[1]).toHaveTextContent('child B')
  })

  it('renders depth-2 nesting: parent → child → grandchild', () => {
    const md = '- parent\n  - child\n    - grandchild'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const doubleNested = container.querySelector('ul ul')
    expect(doubleNested).toBeInTheDocument()
    const allLis = Array.from(container.querySelectorAll('li'))
    expect(allLis.some((li) => li.textContent?.includes('grandchild'))).toBe(true)
  })

  it('renders depth-3 nesting: parent → child → grandchild → great-grandchild', () => {
    const md = '- top\n  - child\n    - grandchild\n      - great-grandchild'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const tripleNested = container.querySelector('ul ul ul')
    expect(tripleNested).toBeInTheDocument()
    const allLis = Array.from(container.querySelectorAll('li'))
    expect(allLis.some((li) => li.textContent?.includes('great-grandchild'))).toBe(true)
  })

  it('renders mixed ordered/unordered nesting (ol containing ul)', () => {
    const md = '1. item one\n   - bullet a\n   - bullet b'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const ol = container.querySelector('ol')
    expect(ol).toBeInTheDocument()
    const nestedUl = ol!.querySelector('ul')
    expect(nestedUl).toBeInTheDocument()
    expect(nestedUl!.children).toHaveLength(2)
  })

  it('flat list still renders with list-disc and ml-5 classes (backward compat)', () => {
    const md = '- item 1\n- item 2\n- item 3'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const ul = container.querySelector('ul')
    expect(ul).toHaveClass('list-disc')
    expect(ul).toHaveClass('ml-5')
    // Use children (direct element children) instead of :scope > li — jsdom 25 has a bug
    // where :scope > selector matches all descendants, not just direct children
    expect(ul!.children).toHaveLength(3)
  })

  it('flat ordered list still renders with list-decimal and ml-5 classes (backward compat)', () => {
    const md = '1. first\n2. second\n3. third'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const ol = container.querySelector('ol')
    expect(ol).toHaveClass('list-decimal')
    expect(ol).toHaveClass('ml-5')
  })

  it('existing note content with no nesting is unaffected', () => {
    const md = '- simple\n- flat\n- list'
    const { container } = render(<>{renderMarkdown(md)}</>)
    expect(container.querySelector('ul')!.children).toHaveLength(3)
    expect(container.querySelector('ul ul')).not.toBeInTheDocument()
  })

  it('two top-level bullets with nested children under first', () => {
    const md = '- top\n  - nested one\n  - nested two\n- another top'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const topUl = container.querySelector('ul')!
    // Use .children (direct element children) — jsdom 25 has a :scope > bug
    expect(topUl.children).toHaveLength(2)
    expect(topUl.children[1]).toHaveTextContent('another top')
    const nestedUl = topUl.children[0].querySelector('ul')
    expect(nestedUl).toBeInTheDocument()
    expect(nestedUl!.children).toHaveLength(2)
  })

  it('ordered list <li> items do not have ml-4 class (backward compat)', () => {
    const md = '1. first\n2. second\n3. third'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const ol = container.querySelector('ol')!
    Array.from(ol.children).forEach((li) => {
      expect(li).not.toHaveClass('ml-4')
    })
  })

  it('unordered list <li> items retain ml-4 class', () => {
    const md = '- alpha\n- beta'
    const { container } = render(<>{renderMarkdown(md)}</>)
    const ul = container.querySelector('ul')!
    Array.from(ul.children).forEach((li) => {
      expect(li).toHaveClass('ml-4')
    })
  })
})

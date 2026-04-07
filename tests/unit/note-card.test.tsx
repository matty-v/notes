import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteCard } from '@/components/note-card'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMockNote, resetIdCounter } from '../utils/factories'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function renderWithQueryClient(ui: React.ReactElement) {
  const Wrapper = createWrapper()
  return render(<Wrapper>{ui}</Wrapper>)
}

describe('NoteCard', () => {
  let mockNote: ReturnType<typeof createMockNote>

  const mockOnOpenModal = vi.fn()

  beforeEach(() => {
    resetIdCounter()
    vi.clearAllMocks()
    mockNote = createMockNote({
      title: 'Test Note',
      content: 'This is test content',
      tags: 'test,example',
    })
  })

  it('should render note title and content', () => {
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} />
    )

    expect(screen.getByText('Test Note')).toBeInTheDocument()
    expect(screen.getByText('This is test content')).toBeInTheDocument()
  })

  it('should render tags', () => {
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} />
    )

    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('example')).toBeInTheDocument()
  })

  it('should call onOpenModal when card is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} />
    )

    const card = screen.getByText('Test Note').closest('div')
    await user.click(card!)

    expect(mockOnOpenModal).toHaveBeenCalled()
  })

it('should render with grid variant', () => {
    const { container } = renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} variant="grid" />
    )

    const card = container.querySelector('[class*="min-h-"]')
    expect(card).toBeInTheDocument()
  })

  describe('clickable links', () => {
    it('should render URLs in content as clickable links', () => {
      const noteWithUrl = createMockNote({
        content: 'Check out https://example.com for more info',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithUrl} onOpenModal={mockOnOpenModal} />
      )

      const link = container.querySelector('a[href*="example.com"]') as HTMLAnchorElement
      expect(link).toBeInTheDocument()
      expect(link.href).toContain('example.com')
    })

    it('should render links with security attributes', () => {
      const noteWithUrl = createMockNote({
        content: 'Visit https://example.com',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithUrl} onOpenModal={mockOnOpenModal} />
      )

      const link = container.querySelector('a') as HTMLAnchorElement
      expect(link).toBeInTheDocument()
      expect(link.target).toBe('_blank')
      expect(link.rel).toContain('noopener')
      expect(link.rel).toContain('noreferrer')
    })

    it('should render www. URLs as clickable links with https prefix', () => {
      const noteWithWww = createMockNote({
        content: 'Go to www.example.com',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithWww} onOpenModal={mockOnOpenModal} />
      )

      const link = container.querySelector('a[href*="www.example.com"]') as HTMLAnchorElement
      expect(link).toBeInTheDocument()
      expect(link.href).toContain('https://')
    })

    it('should render multiple URLs as separate clickable links', () => {
      const noteWithMultipleUrls = createMockNote({
        content: 'Check https://one.com and https://two.com',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithMultipleUrls} onOpenModal={mockOnOpenModal} />
      )

      const links = container.querySelectorAll('a')
      expect(links.length).toBeGreaterThanOrEqual(2)
      expect(Array.from(links).some((l) => l.href.includes('one.com'))).toBe(true)
      expect(Array.from(links).some((l) => l.href.includes('two.com'))).toBe(true)
    })
  })

  // Regression coverage for the markdown XSS fix shipped in commit
  // 4afc738 (P0-1). The custom marked renderer.link previously interpolated
  // hrefs verbatim, allowing [click](javascript:alert(1)) to render a
  // working javascript: link. sanitizeHref now allows only http/https/
  // mailto/relative schemes; everything else renders as plain text.
  describe('XSS protection in markdown links', () => {
    it('should not render javascript: links from markdown', () => {
      const noteWithXss = createMockNote({
        content: '[click me](javascript:alert(1))',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithXss} onOpenModal={mockOnOpenModal} />
      )

      // No anchor tag should reference javascript: at all
      const allLinks = container.querySelectorAll('a')
      Array.from(allLinks).forEach((l) => {
        expect(l.href.toLowerCase()).not.toContain('javascript:')
      })
      // The label still appears as plain text
      expect(container.textContent).toContain('click me')
    })

    it('should not render data: URI links from markdown', () => {
      const noteWithData = createMockNote({
        content: '[evil](data:text/html,<script>alert(1)</script>)',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithData} onOpenModal={mockOnOpenModal} />
      )

      const allLinks = container.querySelectorAll('a')
      Array.from(allLinks).forEach((l) => {
        expect(l.href.toLowerCase()).not.toContain('data:')
      })
      expect(container.textContent).toContain('evil')
    })

    it('should not render vbscript: links from markdown', () => {
      const noteWithVbs = createMockNote({
        content: '[bad](vbscript:msgbox)',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithVbs} onOpenModal={mockOnOpenModal} />
      )

      const allLinks = container.querySelectorAll('a')
      Array.from(allLinks).forEach((l) => {
        expect(l.href.toLowerCase()).not.toContain('vbscript:')
      })
      expect(container.textContent).toContain('bad')
    })

    it('should still allow http and https links', () => {
      const noteWithSafe = createMockNote({
        content: '[safe](https://example.com)',
      })
      const { container } = renderWithQueryClient(
        <NoteCard note={noteWithSafe} onOpenModal={mockOnOpenModal} />
      )

      const link = container.querySelector('a[href*="example.com"]') as HTMLAnchorElement
      expect(link).toBeInTheDocument()
      expect(link.href).toContain('https://example.com')
    })
  })
})

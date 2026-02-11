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
  const mockOnDelete = vi.fn().mockResolvedValue(undefined)

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
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
    )

    expect(screen.getByText('Test Note')).toBeInTheDocument()
    expect(screen.getByText('This is test content')).toBeInTheDocument()
  })

  it('should render tags', () => {
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
    )

    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('example')).toBeInTheDocument()
  })

  it('should call onOpenModal when card is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
    )

    const card = screen.getByText('Test Note').closest('div')
    await user.click(card!)

    expect(mockOnOpenModal).toHaveBeenCalled()
  })

  it('should call onOpenModal when edit button is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
    )

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    expect(mockOnOpenModal).toHaveBeenCalled()
  })

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnDeleteFn = vi.fn().mockResolvedValue(undefined)
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} onDelete={mockOnDeleteFn} />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    expect(mockOnDeleteFn).toHaveBeenCalled()
  })

  it('should render with grid variant', () => {
    renderWithQueryClient(
      <NoteCard note={mockNote} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} variant="grid" />
    )

    const card = screen.getByText('Test Note').closest('div')
    expect(card).toHaveClass('min-h-\\[200px\\]')
  })

  describe('clickable links', () => {
    it('should render URLs in content as clickable links', () => {
      const noteWithUrl = createMockNote({
        content: 'Check out https://example.com for more info',
      })
      renderWithQueryClient(
        <NoteCard note={noteWithUrl} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
      )

      const link = screen.getByRole('link', { name: /https:\/\/example\.com/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com')
    })

    it('should render links with security attributes', () => {
      const noteWithUrl = createMockNote({
        content: 'Visit https://example.com',
      })
      renderWithQueryClient(
        <NoteCard note={noteWithUrl} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should render www. URLs as clickable links with https prefix', () => {
      const noteWithWww = createMockNote({
        content: 'Go to www.example.com',
      })
      renderWithQueryClient(
        <NoteCard note={noteWithWww} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('www.example.com')
      expect(link).toHaveAttribute('href', 'https://www.example.com')
    })

    it('should render multiple URLs as separate clickable links', () => {
      const noteWithMultipleUrls = createMockNote({
        content: 'Check https://one.com and https://two.com',
      })
      renderWithQueryClient(
        <NoteCard note={noteWithMultipleUrls} onOpenModal={mockOnOpenModal} onDelete={mockOnDelete} />
      )

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      expect(links[0]).toHaveAttribute('href', 'https://one.com')
      expect(links[1]).toHaveAttribute('href', 'https://two.com')
    })
  })
})

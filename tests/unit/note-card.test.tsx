import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteCard } from '@/components/note-card'
import type { Note } from '@/lib/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
  const mockNote: Note = {
    id: '1',
    title: 'Test Note',
    content: 'This is test content',
    tags: 'test,example',
    createdAt: new Date('2024-01-01').getTime(),
    updatedAt: new Date('2024-01-01').getTime(),
  }

  const mockOnUpdate = vi.fn().mockResolvedValue(undefined)
  const mockOnDelete = vi.fn().mockResolvedValue(undefined)

  it('should render note title and content', () => {
    renderWithQueryClient(
      <NoteCard note={mockNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    expect(screen.getByText('Test Note')).toBeInTheDocument()
    expect(screen.getByText('This is test content')).toBeInTheDocument()
  })

  it('should render tags', () => {
    renderWithQueryClient(
      <NoteCard note={mockNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('example')).toBeInTheDocument()
  })

  it('should show edit form when edit button is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <NoteCard note={mockNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    const buttons = screen.getAllByRole('button')
    const editButton = buttons[0] // First button is the edit button
    await user.click(editButton)

    expect(screen.getByPlaceholderText('Note title...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Write your note...')).toBeInTheDocument()
  })

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnDeleteFn = vi.fn().mockResolvedValue(undefined)
    renderWithQueryClient(
      <NoteCard note={mockNote} onUpdate={mockOnUpdate} onDelete={mockOnDeleteFn} />
    )

    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)

    expect(mockOnDeleteFn).toHaveBeenCalled()
  })

  it('should not show expand/collapse indicator for short content', () => {
    const shortNote: Note = {
      ...mockNote,
      content: 'Short content',
    }
    renderWithQueryClient(
      <NoteCard note={shortNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    expect(screen.queryByText('Show more')).not.toBeInTheDocument()
    expect(screen.queryByText('Show less')).not.toBeInTheDocument()
  })

  it('should show "Show more" indicator for truncated content', () => {
    const longNote: Note = {
      ...mockNote,
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    }

    // Mock scrollHeight to be greater than clientHeight to simulate truncation
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      value: 200,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 100,
    })

    renderWithQueryClient(
      <NoteCard note={longNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    expect(screen.getByText('Show more')).toBeInTheDocument()
  })

  it('should expand content when "Show more" is clicked', async () => {
    const user = userEvent.setup()
    const longNote: Note = {
      ...mockNote,
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    }

    // Mock scrollHeight to be greater than clientHeight to simulate truncation
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      value: 200,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 100,
    })

    renderWithQueryClient(
      <NoteCard note={longNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    const showMoreButton = screen.getByRole('button', { name: /show more/i })
    await user.click(showMoreButton)

    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('should collapse content when "Show less" is clicked', async () => {
    const user = userEvent.setup()
    const longNote: Note = {
      ...mockNote,
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    }

    // Mock scrollHeight to be greater than clientHeight to simulate truncation
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      value: 200,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 100,
    })

    renderWithQueryClient(
      <NoteCard note={longNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    const showMoreButton = screen.getByRole('button', { name: /show more/i })
    await user.click(showMoreButton)

    const showLessButton = screen.getByRole('button', { name: /show less/i })
    await user.click(showLessButton)

    expect(screen.getByText('Show more')).toBeInTheDocument()
  })

  it('should support keyboard navigation for expand/collapse', async () => {
    const user = userEvent.setup()
    const longNote: Note = {
      ...mockNote,
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    }

    // Mock scrollHeight to be greater than clientHeight to simulate truncation
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      value: 200,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 100,
    })

    renderWithQueryClient(
      <NoteCard note={longNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    const showMoreButton = screen.getByRole('button', { name: /show more/i })
    showMoreButton.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByText('Show less')).toBeInTheDocument()
  })
})

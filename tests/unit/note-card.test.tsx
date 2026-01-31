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

  const mockOnUpdate = vi.fn().mockResolvedValue(undefined)
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

  it('should call onDelete when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    const mockOnDeleteFn = vi.fn().mockResolvedValue(undefined)
    renderWithQueryClient(
      <NoteCard note={mockNote} onUpdate={mockOnUpdate} onDelete={mockOnDeleteFn} />
    )

    // Click the trash icon to open the confirmation dialog
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)

    // Confirm deletion by clicking the "Delete" button in the dialog
    const confirmDeleteButton = screen.getByRole('button', { name: /^Delete$/i })
    await user.click(confirmDeleteButton)

    expect(mockOnDeleteFn).toHaveBeenCalled()
  })

  it('should not call onDelete when delete is cancelled', async () => {
    const user = userEvent.setup()
    const mockOnDeleteFn = vi.fn().mockResolvedValue(undefined)
    renderWithQueryClient(
      <NoteCard note={mockNote} onUpdate={mockOnUpdate} onDelete={mockOnDeleteFn} />
    )

    // Click the trash icon to open the confirmation dialog
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)

    // Cancel deletion by clicking the "Cancel" button in the dialog
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelButton)

    expect(mockOnDeleteFn).not.toHaveBeenCalled()
  })

  it('should not show expand/collapse indicator for short content', () => {
    const shortNote = createMockNote({ content: 'Short content' })
    renderWithQueryClient(
      <NoteCard note={shortNote} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    )

    expect(screen.queryByText('Show more')).not.toBeInTheDocument()
    expect(screen.queryByText('Show less')).not.toBeInTheDocument()
  })

  it('should show "Show more" indicator for truncated content', () => {
    const longNote = createMockNote({
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    })

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
    const longNote = createMockNote({
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    })

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
    const longNote = createMockNote({
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    })

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
    const longNote = createMockNote({
      content: 'This is a very long note content that will definitely be truncated because it has many lines. '.repeat(10),
    })

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

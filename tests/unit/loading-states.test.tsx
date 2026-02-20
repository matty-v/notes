import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateNoteModal } from '@/components/create-note-modal'
import { NoteModal } from '@/components/note-modal'
import type { Note } from '@/lib/types'

// Mock useTemplates since CreateNoteModal depends on it
vi.mock('@/hooks/use-templates', () => ({
  useTemplates: () => ({ templates: [] }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function renderWithProviders(ui: React.ReactElement) {
  const Wrapper = createWrapper()
  return render(ui, { wrapper: Wrapper })
}

const mockNote: Note = {
  id: 'note-1',
  sourceId: 'test-source',
  title: 'Test Note',
  content: 'Test content',
  tags: 'tag1, tag2',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('CreateNoteModal loading states', () => {
  it('should show spinner and "Creating..." text when isCreating is true', () => {
    renderWithProviders(
      <CreateNoteModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isCreating={true}
      />
    )

    expect(screen.getByText('Creating...')).toBeInTheDocument()
  })

  it('should show "Generating..." when isCreating and isGeneratingAI are both true', () => {
    renderWithProviders(
      <CreateNoteModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isCreating={true}
        isGeneratingAI={true}
      />
    )

    expect(screen.getByText('Generating...')).toBeInTheDocument()
  })

  it('should disable Create button when isCreating is true', () => {
    renderWithProviders(
      <CreateNoteModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isCreating={true}
      />
    )

    const button = screen.getByRole('button', { name: /creating/i })
    expect(button).toBeDisabled()
  })

  it('should show normal Create button when not creating', () => {
    renderWithProviders(
      <CreateNoteModal
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isCreating={false}
      />
    )

    expect(screen.getByText('Create')).toBeInTheDocument()
  })
})

describe('NoteModal loading states', () => {
  const defaultProps = {
    note: mockNote,
    open: true,
    onOpenChange: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  }

  it('should show "Updating..." on Update button when isUpdating becomes true in edit mode', async () => {
    const user = userEvent.setup()

    // Start without updating so Edit button is clickable
    const { rerender } = renderWithProviders(
      <NoteModal {...defaultProps} isUpdating={false} />
    )

    // Click Edit to enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    // Now simulate isUpdating becoming true (user submitted form)
    rerender(
      <NoteModal {...defaultProps} isUpdating={true} />
    )

    expect(screen.getByText('Updating...')).toBeInTheDocument()
  })

  it('should disable Update button when isUpdating is true in edit mode', async () => {
    const user = userEvent.setup()

    const { rerender } = renderWithProviders(
      <NoteModal {...defaultProps} isUpdating={false} />
    )

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    rerender(
      <NoteModal {...defaultProps} isUpdating={true} />
    )

    const updateButton = screen.getByRole('button', { name: /updating/i })
    expect(updateButton).toBeDisabled()
  })

  it('should disable Delete and Edit buttons while updating', () => {
    renderWithProviders(
      <NoteModal {...defaultProps} isUpdating={true} />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    const editButton = screen.getByRole('button', { name: /edit/i })
    expect(deleteButton).toBeDisabled()
    expect(editButton).toBeDisabled()
  })

  it('should show "Generating..." when isUpdating and isGeneratingAI are both true in edit mode', async () => {
    const user = userEvent.setup()

    const { rerender } = renderWithProviders(
      <NoteModal {...defaultProps} isUpdating={false} isGeneratingAI={false} />
    )

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    rerender(
      <NoteModal {...defaultProps} isUpdating={true} isGeneratingAI={true} />
    )

    expect(screen.getByText('Generating...')).toBeInTheDocument()
  })
})

describe('useNotes exposes isCreating and isUpdating', () => {
  beforeEach(async () => {
    const { db } = await import('@/lib/db')
    await db.notes.clear()
  })

  it('should expose isCreating and isUpdating flags', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useNotes } = await import('@/hooks/use-notes')

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet' }), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isCreating).toBe(false)
    expect(result.current.isUpdating).toBe(false)
  })
})

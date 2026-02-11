import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NoteForm } from '@/components/note-form'

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

describe('NoteForm', () => {
  it('should disable Save button when both title and content are empty', () => {
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('should enable Save button when title has content', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const titleInput = screen.getByPlaceholderText('Note title...')
    await user.type(titleInput, 'My Note')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeEnabled()
  })

  it('should enable Save button when content has text', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const contentTextarea = screen.getByPlaceholderText(/Write your note/)
    await user.type(contentTextarea, 'Note content here')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeEnabled()
  })

  it('should disable Save button when only whitespace is entered in title', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const titleInput = screen.getByPlaceholderText('Note title...')
    await user.type(titleInput, '   ')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('should disable Save button when only whitespace is entered in content', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const contentTextarea = screen.getByPlaceholderText(/Write your note/)
    await user.type(contentTextarea, '   ')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('should enable Save button when both title and content have text', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const titleInput = screen.getByPlaceholderText('Note title...')
    const contentTextarea = screen.getByPlaceholderText(/Write your note/)

    await user.type(titleInput, 'My Title')
    await user.type(contentTextarea, 'My Content')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeEnabled()
  })

  it('should call onSubmit when form is submitted with title only', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const titleInput = screen.getByPlaceholderText('Note title...')
    await user.type(titleInput, 'My Title')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'My Title',
        content: '',
        tags: '',
      })
    })
  })

  it('should call onSubmit when form is submitted with content only', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)

    const contentTextarea = screen.getByPlaceholderText(/Write your note/)
    await user.type(contentTextarea, 'Just content')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: '',
        content: 'Just content',
        tags: '',
      })
    })
  })

  it('should show custom submit label', () => {
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} submitLabel="Update" />)

    const updateButton = screen.getByRole('button', { name: /update/i })
    expect(updateButton).toBeInTheDocument()
  })

  it('should populate form with initial values', () => {
    const onSubmit = vi.fn()
    const initialValues = {
      title: 'Existing Title',
      content: 'Existing Content',
      tags: ['tag1', 'tag2'],
    }
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} initialValues={initialValues} />)

    const titleInput = screen.getByPlaceholderText('Note title...') as HTMLInputElement
    const contentTextarea = screen.getByPlaceholderText(/Write your note/) as HTMLTextAreaElement

    expect(titleInput.value).toBe('Existing Title')
    expect(contentTextarea.value).toBe('Existing Content')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeEnabled()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

describe('NoteForm - Tab/Shift-Tab indentation', () => {
  function setup() {
    const onSubmit = vi.fn()
    renderWithQueryClient(<NoteForm onSubmit={onSubmit} />)
    return screen.getByPlaceholderText(/Write your note/) as HTMLTextAreaElement
  }

  function setValueAndCaret(textarea: HTMLTextAreaElement, value: string, start: number, end = start) {
    fireEvent.change(textarea, { target: { value } })
    textarea.setSelectionRange(start, end)
  }

  it('Tab inserts two spaces at the caret position', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '- item', 0, 0)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    expect(textarea.value).toBe('  - item')
  })

  it('Tab inserts two spaces mid-string at caret', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '- item', 2, 2)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    expect(textarea.value).toBe('-   item')
  })

  it('Shift-Tab removes two leading spaces from the current line', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '  - item', 4, 4)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true })
    expect(textarea.value).toBe('- item')
  })

  it('Shift-Tab removes one leading space when line has only one', () => {
    const textarea = setup()
    setValueAndCaret(textarea, ' - item', 2, 2)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true })
    expect(textarea.value).toBe('- item')
  })

  it('Shift-Tab does nothing when line has no leading spaces', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '- item', 2, 2)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true })
    expect(textarea.value).toBe('- item')
  })

  it('Tab indents all lines in a multi-line selection', () => {
    const textarea = setup()
    const content = '- line one\n- line two\n- line three'
    setValueAndCaret(textarea, content, 0, content.length)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    expect(textarea.value).toBe('  - line one\n  - line two\n  - line three')
  })

  it('Shift-Tab dedents all lines in a multi-line selection', () => {
    const textarea = setup()
    const content = '  - line one\n  - line two\n  - line three'
    setValueAndCaret(textarea, content, 0, content.length)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true })
    expect(textarea.value).toBe('- line one\n- line two\n- line three')
  })

  it('Escape then Tab leaves value unchanged (restores focus-move behavior)', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '- item', 6, 6)
    fireEvent.keyDown(textarea, { key: 'Escape', code: 'Escape' })
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    expect(textarea.value).toBe('- item')
  })

  it('Tab works normally again after Escape+Tab cycle', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '- item', 0, 0)
    fireEvent.keyDown(textarea, { key: 'Escape', code: 'Escape' })
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    // Now Tab should trap again
    setValueAndCaret(textarea, '- item', 0, 0)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    expect(textarea.value).toBe('  - item')
  })

  it('Tab restores cursor to selectionStart + 2 after re-render', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '- item', 0, 0)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    expect(textarea.value).toBe('  - item')
    expect(textarea.selectionStart).toBe(2)
    expect(textarea.selectionEnd).toBe(2)
  })

  it('Tab mid-string restores cursor to selectionStart + 2', () => {
    const textarea = setup()
    // 'helloworld' has no space — inserting at position 5 gives 'hello  world'
    setValueAndCaret(textarea, 'helloworld', 5, 5)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
    expect(textarea.value).toBe('hello  world')
    expect(textarea.selectionStart).toBe(7)
    expect(textarea.selectionEnd).toBe(7)
  })

  it('Shift-Tab restores cursor accounting for removed spaces', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '  - item', 4, 4)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true })
    expect(textarea.value).toBe('- item')
    expect(textarea.selectionStart).toBe(2)
    expect(textarea.selectionEnd).toBe(2)
  })

  it('Shift-Tab clamps cursor to line start when it was inside removed spaces', () => {
    const textarea = setup()
    setValueAndCaret(textarea, '  - item', 1, 1)
    fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab', shiftKey: true })
    expect(textarea.value).toBe('- item')
    expect(textarea.selectionStart).toBe(0)
    expect(textarea.selectionEnd).toBe(0)
  })
})

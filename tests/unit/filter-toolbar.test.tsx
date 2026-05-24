import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterToolbar } from '@/components/filter-toolbar'
import { db } from '@/lib/db'
import type { ReactNode } from 'react'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function renderToolbar(props?: Partial<Parameters<typeof FilterToolbar>[0]>) {
  const defaults = {
    search: '',
    onSearchChange: vi.fn(),
    tagFilter: [] as string[],
    onTagFilterChange: vi.fn(),
    sortOrder: 'newest' as const,
    onSortChange: vi.fn(),
    sourceId: 'test-source',
  }
  const Wrapper = createWrapper()
  return render(
    <Wrapper>
      <FilterToolbar {...defaults} {...props} />
    </Wrapper>
  )
}

describe('FilterToolbar', () => {
  beforeEach(async () => {
    await db.notes.clear()
    vi.clearAllMocks()
  })

  it('renders search input', () => {
    renderToolbar()
    expect(screen.getByPlaceholderText(/search notes/i)).toBeInTheDocument()
  })

  it('renders Tags button', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: /tags/i })).toBeInTheDocument()
  })

  it('renders Sort button with current sort label', () => {
    renderToolbar({ sortOrder: 'newest' })
    expect(screen.getByRole('button', { name: /newest/i })).toBeInTheDocument()
  })

  it('shows Oldest first label when sortOrder is oldest', () => {
    renderToolbar({ sortOrder: 'oldest' })
    expect(screen.getByRole('button', { name: /oldest/i })).toBeInTheDocument()
  })

  it('shows Alphabetical label when sortOrder is alphabetical', () => {
    renderToolbar({ sortOrder: 'alphabetical' })
    expect(screen.getByRole('button', { name: /alphabetical/i })).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    renderToolbar({ onSearchChange })
    await user.type(screen.getByPlaceholderText(/search notes/i), 'hello')
    expect(onSearchChange).toHaveBeenCalled()
  })

  it('shows numeric badge on Tags button when tags are active', () => {
    renderToolbar({ tagFilter: ['work', 'react'] })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show badge when no tags are active', () => {
    renderToolbar({ tagFilter: [] })
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it('Tags button has tooltip about OR semantics', () => {
    renderToolbar()
    const tagsBtn = screen.getByRole('button', { name: /tags/i })
    expect(tagsBtn).toHaveAttribute('title', expect.stringMatching(/any selected tag/i))
  })

  it('opens sort picker when Sort button is clicked', async () => {
    const user = userEvent.setup()
    renderToolbar({ sortOrder: 'newest' })
    const sortBtn = screen.getByRole('button', { name: /newest/i })
    await user.click(sortBtn)
    await waitFor(() => {
      expect(screen.getByText('Newest first')).toBeInTheDocument()
      expect(screen.getByText('Oldest first')).toBeInTheDocument()
      expect(screen.getByText('Alphabetical')).toBeInTheDocument()
    })
  })

  it('calls onSortChange with alphabetical when Alphabetical option is selected', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    renderToolbar({ sortOrder: 'newest', onSortChange })
    await user.click(screen.getByRole('button', { name: /newest/i }))
    await waitFor(() => screen.getByText('Alphabetical'))
    await user.click(screen.getByText('Alphabetical'))
    expect(onSortChange).toHaveBeenCalledWith('alphabetical')
  })

  it('calls onSortChange with oldest when Oldest first is selected', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    renderToolbar({ sortOrder: 'newest', onSortChange })
    await user.click(screen.getByRole('button', { name: /newest/i }))
    await waitFor(() => screen.getByText('Oldest first'))
    await user.click(screen.getByText('Oldest first'))
    expect(onSortChange).toHaveBeenCalledWith('oldest')
  })
})

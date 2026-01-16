import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { db } from '@/lib/db'
import type { Note } from '@/lib/types'

// Mock the sync module to prevent remote calls
vi.mock('@/lib/sync', () => ({
  queueSync: vi.fn(),
  pullFromRemote: vi.fn().mockResolvedValue(undefined),
  processSyncQueue: vi.fn().mockResolvedValue({ success: 0, failed: 0 }),
  getPendingCount: vi.fn().mockResolvedValue(0),
}))

// Mock ResizeObserver for virtualization
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock

// Mock window.matchMedia for theme toggle
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock @tanstack/react-virtual to render all items (JSDOM has no layout engine)
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 120,
        size: 120,
      })),
    getTotalSize: () => count * 120,
    measureElement: () => {},
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

function renderHomePage() {
  const Wrapper = createWrapper()
  return render(<Wrapper><HomePage /></Wrapper>)
}

function createMockNote(index: number): Note {
  const now = new Date()
  now.setMinutes(now.getMinutes() - index)
  return {
    id: `note-${index}`,
    title: `Test Note ${index}`,
    content: `Content for note ${index}`,
    tags: `tag${index % 3}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

describe('HomePage Virtualization', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.pendingSync.clear()
  })

  it('should render the Notes heading', async () => {
    renderHomePage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument()
    })
  })

  it('should show empty state when no notes exist', async () => {
    renderHomePage()

    await waitFor(() => {
      expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
    })
  })

  it('should render notes when they exist', async () => {
    // Add a few notes
    const notes = [createMockNote(0), createMockNote(1), createMockNote(2)]
    await db.notes.bulkAdd(notes)

    renderHomePage()

    await waitFor(() => {
      expect(screen.getByText('Test Note 0')).toBeInTheDocument()
      expect(screen.getByText('Test Note 1')).toBeInTheDocument()
      expect(screen.getByText('Test Note 2')).toBeInTheDocument()
    })
  })

  it('should use virtualization container with proper structure', async () => {
    // Add enough notes to test virtualization structure
    const notes = Array.from({ length: 10 }, (_, i) => createMockNote(i))
    await db.notes.bulkAdd(notes)

    const { container } = renderHomePage()

    await waitFor(() => {
      expect(screen.getByText('Test Note 0')).toBeInTheDocument()
    })

    // Check that the virtualization container exists with relative positioning
    const virtualContainer = container.querySelector('[style*="position: relative"]')
    expect(virtualContainer).toBeInTheDocument()
  })

  it('should render notes with absolute positioning for virtualization', async () => {
    const notes = [createMockNote(0), createMockNote(1)]
    await db.notes.bulkAdd(notes)

    const { container } = renderHomePage()

    await waitFor(() => {
      expect(screen.getByText('Test Note 0')).toBeInTheDocument()
    })

    // Check that note items use absolute positioning (virtualization pattern)
    const absoluteItems = container.querySelectorAll('[style*="position: absolute"]')
    expect(absoluteItems.length).toBeGreaterThan(0)
  })

  it('should have a scrollable container', async () => {
    const notes = [createMockNote(0)]
    await db.notes.bulkAdd(notes)

    const { container } = renderHomePage()

    await waitFor(() => {
      expect(screen.getByText('Test Note 0')).toBeInTheDocument()
    })

    // Check for overflow-y-auto class on scroll container
    const scrollContainer = container.querySelector('.overflow-y-auto')
    expect(scrollContainer).toBeInTheDocument()
  })
})

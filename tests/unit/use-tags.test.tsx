import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { useTags } from '@/hooks/use-tags'
import type { ReactNode } from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTags', () => {
  beforeEach(async () => {
    await db.notes.clear()
  })

  it('should not include tags from soft-deleted notes', async () => {
    // Add a regular note with tags
    await db.notes.add({
      id: 'note-1',
      sourceId: 'test-source',
      title: 'Active Note',
      content: 'Content',
      tags: 'active-tag, shared-tag',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    })

    // Add a soft-deleted note with different tags
    await db.notes.add({
      id: 'note-2',
      sourceId: 'test-source',
      title: 'Deleted Note',
      content: 'Content',
      tags: 'deleted-tag, shared-tag',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: '2024-01-02T00:00:00.000Z',
    })

    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Should include tags from active note
    expect(result.current.tags).toContain('active-tag')
    expect(result.current.tags).toContain('shared-tag')

    // Should NOT include tags that only exist on deleted notes
    expect(result.current.tags).not.toContain('deleted-tag')
  })
})

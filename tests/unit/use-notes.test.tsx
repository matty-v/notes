import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { useNotes } from '@/hooks/use-notes'
import type { ReactNode } from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useNotes', () => {
  beforeEach(async () => {
    await db.notes.clear()
    await db.pendingSync.clear()
  })

  it('should return empty array initially', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.notes).toEqual([])
  })

  it('should create a note', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.createNote({
        title: 'Test Note',
        content: 'Content here',
        tags: 'work',
      })
    })

    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    expect(result.current.notes[0].title).toBe('Test Note')
  })

  it('should soft delete a note (set deletedAt instead of removing)', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper: createWrapper() })

    // Create a note
    await act(async () => {
      await result.current.createNote({
        title: 'To Delete',
        content: 'Will be soft deleted',
        tags: '',
      })
    })

    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    const noteId = result.current.notes[0].id

    // Delete the note
    await act(async () => {
      await result.current.deleteNote(noteId)
    })

    // Note should not appear in the list
    await waitFor(() => expect(result.current.notes).toHaveLength(0))

    // But note should still exist in DB with deletedAt set
    const dbNote = await db.notes.get(noteId)
    expect(dbNote).toBeDefined()
    expect(dbNote?.deletedAt).toBeDefined()
  })
})

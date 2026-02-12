import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { useNotes } from '@/hooks/use-notes'
import type { ReactNode } from 'react'

// Mock the notes-api module
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('@/lib/notes-api', () => ({
  getNotesSheet: vi.fn(() => ({
    createRow: vi.fn(async (data: any) => ({ rowIndex: 2, data })),
    updateRow: vi.fn(async (_rowIndex: number, data: any) => data),
    getRows: vi.fn(async () => []),
    deleteRow: vi.fn(),
  })),
}))
/* eslint-enable @typescript-eslint/no-explicit-any */

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
    vi.clearAllMocks()
  })

  it('should return empty array initially', async () => {
    const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.notes).toEqual([])
  })

  it('should create a note and call remote API first', async () => {
    const { getNotesSheet } = await import('@/lib/notes-api')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockCreateRow = vi.fn(async (data: any) => ({ rowIndex: 2, data }))
    vi.mocked(getNotesSheet).mockReturnValue({
      createRow: mockCreateRow,
      updateRow: vi.fn(),
      getRows: vi.fn(async () => []),
      deleteRow: vi.fn(),
    })

    const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.createNote({
        title: 'Test Note',
        content: 'Content here',
        tags: 'work',
      })
    })

    // Verify remote API was called
    expect(mockCreateRow).toHaveBeenCalledOnce()
    expect(mockCreateRow.mock.calls[0][0]).toMatchObject({
      title: 'Test Note',
      content: 'Content here',
      tags: 'work',
    })

    // Verify local cache was updated
    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    expect(result.current.notes[0].title).toBe('Test Note')
  })

  it('should soft delete a note via remote API first', async () => {
    const { getNotesSheet } = await import('@/lib/notes-api')
    const mockUpdateRow = vi.fn(async (_rowIndex, data) => data)
    const mockGetRows = vi.fn()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getNotesSheet).mockReturnValue({
      createRow: vi.fn(async (data: any) => ({ rowIndex: 2, data })),
      updateRow: mockUpdateRow,
      getRows: mockGetRows,
      deleteRow: vi.fn(),
    })

    const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
      wrapper: createWrapper(),
    })

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

    // Mock getRows to return the note for the delete operation
    mockGetRows.mockResolvedValueOnce([{ id: noteId, title: 'To Delete' }])

    // Delete the note
    await act(async () => {
      await result.current.deleteNote(noteId)
    })

    // Verify remote API was called with deletedAt
    expect(mockUpdateRow).toHaveBeenCalledOnce()
    expect(mockUpdateRow.mock.calls[0][1]).toMatchObject({
      id: noteId,
      deletedAt: expect.any(String),
    })

    // Note should not appear in the list
    await waitFor(() => expect(result.current.notes).toHaveLength(0))

    // But note should still exist in DB with deletedAt set
    const dbNote = await db.notes.get(noteId)
    expect(dbNote).toBeDefined()
    expect(dbNote?.deletedAt).toBeDefined()
  })

  it('should throw error when creating note without spreadsheetId', async () => {
    const { result } = renderHook(() => useNotes({}), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await expect(
        result.current.createNote({
          title: 'Test',
          content: 'Test',
          tags: '',
        })
      ).rejects.toThrow('No active source configured')
    })
  })
})

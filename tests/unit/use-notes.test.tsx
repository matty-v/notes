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

  it('should hard delete a note via remote deleteRow and locally tombstone', async () => {
    // The remote sheets-db-api updateRow silently drops fields that don't
    // match an existing column header — including `deletedAt` when the sheet
    // was provisioned without that column. So syncDeleteToRemote uses
    // deleteRow() to physically remove the row instead of trying to write
    // a soft-delete marker that the API would discard.
    //
    // Locally, the note still gets a deletedAt timestamp so the optimistic
    // update + rollback machinery in useNotes can restore it on sync failure.

    const { getNotesSheet } = await import('@/lib/notes-api')
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const mockUpdateRow = vi.fn(async (_rowIndex: number, data: any) => data)
    const mockDeleteRow = vi.fn(async (_rowIndex: number) => undefined)
    const mockGetRows = vi.fn()

    vi.mocked(getNotesSheet).mockReturnValue({
      createRow: vi.fn(async (data: any) => ({ rowIndex: 2, data })),
      updateRow: mockUpdateRow,
      getRows: mockGetRows,
      deleteRow: mockDeleteRow,
    })
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
      wrapper: createWrapper(),
    })

    // Create a note
    await act(async () => {
      await result.current.createNote({
        title: 'To Delete',
        content: 'Will be deleted',
        tags: '',
      })
    })

    await waitFor(() => expect(result.current.notes).toHaveLength(1))
    const noteId = result.current.notes[0].id

    // Delete the note
    await act(async () => {
      await result.current.deleteNote(noteId)
    })

    // Verify remote deleteRow was called (and updateRow was NOT)
    expect(mockDeleteRow).toHaveBeenCalledOnce()
    expect(mockUpdateRow).not.toHaveBeenCalled()
    // deleteRow takes a row index — should be the cached one from create (2)
    expect(mockDeleteRow.mock.calls[0][0]).toBe(2)

    // Note should not appear in the list
    await waitFor(() => expect(result.current.notes).toHaveLength(0))

    // But note should still exist in DB with deletedAt set (local tombstone
    // for rollback support — cleared on next refreshCacheFromRemote)
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

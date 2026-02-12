import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '@/lib/db'
import { resetCacheForSource } from '@/lib/cache-reset'
import type { Note } from '@/lib/types'

const TEST_SOURCE_ID = 'test-source'
const TEST_SPREADSHEET_ID = 'test-spreadsheet-123'

const mockNote: Note = {
  id: 'note-1',
  sourceId: TEST_SOURCE_ID,
  title: 'Test Note',
  content: 'Test content',
  tags: 'test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

vi.mock('@/lib/notes-api', () => ({
  getNotesSheet: vi.fn(),
  isApiReachable: vi.fn(),
}))

describe('Cache Reset', () => {
  beforeEach(async () => {
    await db.notes.clear()
    vi.clearAllMocks()
  })

  it('should abort if API is not reachable', async () => {
    const { isApiReachable } = await import('@/lib/notes-api')
    vi.mocked(isApiReachable).mockResolvedValueOnce(false)

    const result = await resetCacheForSource(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not reachable')
  })

  it('should fetch data before clearing local cache', async () => {
    // Setup: Add a local note that should be cleared
    await db.notes.put(mockNote)
    expect(await db.notes.count()).toBe(1)

    // Setup mocks
    const { isApiReachable, getNotesSheet } = await import('@/lib/notes-api')

    vi.mocked(isApiReachable).mockResolvedValueOnce(true)

    const mockRemoteNote: Note = {
      ...mockNote,
      id: 'note-2',
      title: 'Fresh Note',
      updatedAt: new Date().toISOString(),
    }

    const mockSheetFn = vi.fn()
    mockSheetFn.mockResolvedValueOnce([mockRemoteNote])

    vi.mocked(getNotesSheet).mockReturnValueOnce({
      getRows: mockSheetFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const result = await resetCacheForSource(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

    expect(result.success).toBe(true)
    // Old note should be gone
    const notes = await db.notes.toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe('note-2')
  })

  it('should only clear notes for the specified source', async () => {
    const otherSourceId = 'other-source'
    const noteFromOtherSource: Note = {
      ...mockNote,
      sourceId: otherSourceId,
    }

    // Setup: Add notes from both sources
    await db.notes.put(mockNote)
    await db.notes.put(noteFromOtherSource)

    // Setup mocks
    const { isApiReachable, getNotesSheet } = await import('@/lib/notes-api')

    vi.mocked(isApiReachable).mockResolvedValueOnce(true)

    const mockSheetFn = vi.fn()
    mockSheetFn.mockResolvedValueOnce([])

    vi.mocked(getNotesSheet).mockReturnValueOnce({
      getRows: mockSheetFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await resetCacheForSource(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

    const notes = await db.notes.toArray()
    // Only the other source's note should remain
    expect(notes).toHaveLength(1)
    expect(notes[0].sourceId).toBe(otherSourceId)
  })

  it('should skip remote notes with deletedAt flag', async () => {
    const deletedNote: Note = {
      ...mockNote,
      id: 'note-deleted',
      deletedAt: new Date().toISOString(),
    }

    const activeNote: Note = {
      ...mockNote,
      id: 'note-active',
    }

    // Setup mocks
    const { isApiReachable, getNotesSheet } = await import('@/lib/notes-api')

    vi.mocked(isApiReachable).mockResolvedValueOnce(true)

    const mockSheetFn = vi.fn()
    mockSheetFn.mockResolvedValueOnce([deletedNote, activeNote])

    vi.mocked(getNotesSheet).mockReturnValueOnce({
      getRows: mockSheetFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await resetCacheForSource(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

    const notes = await db.notes.toArray()
    // Only the active note should be stored
    expect(notes).toHaveLength(1)
    expect(notes[0].id).toBe('note-active')
  })

  it('should call onProgress callback with status updates', async () => {
    const progressMessages: string[] = []
    const onProgress = vi.fn((msg: string) => progressMessages.push(msg))

    const { isApiReachable, getNotesSheet } = await import('@/lib/notes-api')

    vi.mocked(isApiReachable).mockResolvedValueOnce(true)

    const mockSheetFn = vi.fn()
    mockSheetFn.mockResolvedValueOnce([mockNote])

    vi.mocked(getNotesSheet).mockReturnValueOnce({
      getRows: mockSheetFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await resetCacheForSource(TEST_SOURCE_ID, TEST_SPREADSHEET_ID, { onProgress })

    expect(onProgress).toHaveBeenCalled()
    expect(progressMessages).toContain('Checking connection...')
    expect(progressMessages).toContain('Fetching fresh data from source...')
    expect(progressMessages).toContain('Clearing local cache...')
    expect(progressMessages).toContain('Writing fresh data...')
  })

  it('should handle fetch errors gracefully', async () => {
    const { isApiReachable, getNotesSheet } = await import('@/lib/notes-api')

    vi.mocked(isApiReachable).mockResolvedValueOnce(true)

    const mockSheetFn = vi.fn()
    mockSheetFn.mockRejectedValueOnce(new Error('Network error'))

    vi.mocked(getNotesSheet).mockReturnValueOnce({
      getRows: mockSheetFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const result = await resetCacheForSource(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })
})

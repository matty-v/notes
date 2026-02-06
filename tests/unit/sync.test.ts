import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '@/lib/db'
import { queueSync, getPendingCount, pullFromRemote } from '@/lib/sync'
import type { Note } from '@/lib/types'

vi.mock('@/lib/notes-api', () => ({
  getNotesSheet: vi.fn(),
  isApiReachable: vi.fn(),
}))

const TEST_SOURCE_ID = 'test-source'
const TEST_SPREADSHEET_ID = 'test-spreadsheet-123'

describe('Sync Service', () => {
  beforeEach(async () => {
    await db.pendingSync.clear()
    await db.notes.clear()
  })

  it('should queue a create operation', async () => {
    const note: Note = {
      id: 'note-1',
      sourceId: TEST_SOURCE_ID,
      title: 'Test',
      content: 'Content',
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await queueSync('create', note)

    const count = await getPendingCount()
    expect(count).toBe(1)
  })

  it('should queue a create operation with sourceId', async () => {
    const note: Note = {
      id: 'note-1',
      sourceId: TEST_SOURCE_ID,
      title: 'Test',
      content: 'Content',
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await queueSync('create', note)

    const pending = await db.pendingSync.toArray()
    expect(pending[0].sourceId).toBe(TEST_SOURCE_ID)
  })

  it('should queue a delete operation', async () => {
    const note: Note = {
      id: 'note-1',
      sourceId: TEST_SOURCE_ID,
      title: '',
      content: '',
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await queueSync('delete', note)

    const pending = await db.pendingSync.toArray()
    expect(pending[0].operation).toBe('delete')
    expect(pending[0].noteId).toBe('note-1')
  })

  it('should count pending items by sourceId', async () => {
    const note1: Note = {
      id: 'note-1',
      sourceId: 'source-a',
      title: 'Test',
      content: '',
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const note2: Note = {
      id: 'note-2',
      sourceId: 'source-b',
      title: 'Test',
      content: '',
      tags: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await queueSync('create', note1)
    await queueSync('create', note2)

    expect(await getPendingCount()).toBe(2)
    expect(await getPendingCount('source-a')).toBe(1)
    expect(await getPendingCount('source-b')).toBe(1)
    expect(await getPendingCount('source-c')).toBe(0)
  })

  describe('pullFromRemote', () => {
    it('should delete local notes when remote has deletedAt set', async () => {
      const { getNotesSheet, isApiReachable } = await import('@/lib/notes-api')
      const mockedGetNotesSheet = vi.mocked(getNotesSheet)
      const mockedIsApiReachable = vi.mocked(isApiReachable)

      const localNote: Note = {
        id: 'note-1',
        sourceId: TEST_SOURCE_ID,
        title: 'Local Note',
        content: 'This exists locally',
        tags: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }
      await db.notes.add(localNote)

      const remoteNote = {
        ...localNote,
        deletedAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      }

      mockedIsApiReachable.mockResolvedValue(true)
      mockedGetNotesSheet.mockReturnValue({
        getRows: vi.fn().mockResolvedValue([remoteNote]),
      } as never)

      await pullFromRemote(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

      const result = await db.notes.get('note-1')
      expect(result).toBeUndefined()
    })

    it('should not restore notes that have pending delete operations', async () => {
      const { getNotesSheet, isApiReachable } = await import('@/lib/notes-api')
      const mockedGetNotesSheet = vi.mocked(getNotesSheet)
      const mockedIsApiReachable = vi.mocked(isApiReachable)

      const remoteNote: Note = {
        id: 'note-to-delete',
        sourceId: TEST_SOURCE_ID,
        title: 'Should Not Restore',
        content: 'This note was deleted locally',
        tags: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      mockedIsApiReachable.mockResolvedValue(true)
      mockedGetNotesSheet.mockReturnValue({
        getRows: vi.fn().mockResolvedValue([remoteNote]),
      } as never)

      await queueSync('delete', remoteNote)

      await pullFromRemote(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

      const localNote = await db.notes.get('note-to-delete')
      expect(localNote).toBeUndefined()
    })

    it('should set sourceId on pulled remote notes', async () => {
      const { getNotesSheet, isApiReachable } = await import('@/lib/notes-api')
      const mockedGetNotesSheet = vi.mocked(getNotesSheet)
      const mockedIsApiReachable = vi.mocked(isApiReachable)

      const remoteNote = {
        id: 'note-remote',
        title: 'Remote Note',
        content: 'From remote',
        tags: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      mockedIsApiReachable.mockResolvedValue(true)
      mockedGetNotesSheet.mockReturnValue({
        getRows: vi.fn().mockResolvedValue([remoteNote]),
      } as never)

      await pullFromRemote(TEST_SOURCE_ID, TEST_SPREADSHEET_ID)

      const localNote = await db.notes.get('note-remote')
      expect(localNote).toBeDefined()
      expect(localNote!.sourceId).toBe(TEST_SOURCE_ID)
    })
  })
})

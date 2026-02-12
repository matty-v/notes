import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNotes } from '@/hooks/use-notes'
import { db } from '@/lib/db'
import * as generateMetadataModule from '@/services/claude/generateMetadata'

// Mock the generateMetadata module
vi.mock('@/services/claude/generateMetadata', async () => {
  const actual = await vi.importActual('@/services/claude/generateMetadata')
  return {
    ...actual,
    generateMetadata: vi.fn(),
  }
})

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

describe('useNotes - Auto-generation', () => {
  beforeEach(async () => {
    await db.notes.clear()
    vi.clearAllMocks()
  })

  describe('createNote', () => {
    it('should auto-generate title when title is empty', async () => {
      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce({
        title: 'Generated Title',
        tags: ['tag1', 'tag2'],
      })

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const note = await result.current.createNote({
        title: '',
        content: 'This is my note content',
        tags: 'existing-tag',
      })

      expect(mockGenerate).toHaveBeenCalledWith('This is my note content')
      expect(note.title).toBe('Generated Title')
      expect(note.tags).toBe('existing-tag')
    })

    it('should auto-generate tags when tags are empty', async () => {
      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce({
        title: 'Generated Title',
        tags: ['generated1', 'generated2', 'generated3'],
      })

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const note = await result.current.createNote({
        title: 'My Title',
        content: 'This is my note content',
        tags: '',
      })

      expect(mockGenerate).toHaveBeenCalledWith('This is my note content')
      expect(note.title).toBe('My Title')
      expect(note.tags).toBe('generated1, generated2, generated3')
    })

    it('should auto-generate both title and tags when both are empty', async () => {
      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce({
        title: 'Generated Title',
        tags: ['tag1', 'tag2'],
      })

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const note = await result.current.createNote({
        title: '',
        content: 'This is my note content',
        tags: '',
      })

      expect(mockGenerate).toHaveBeenCalledWith('This is my note content')
      expect(note.title).toBe('Generated Title')
      expect(note.tags).toBe('tag1, tag2')
    })

    it('should not auto-generate when title and tags are provided', async () => {
      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const note = await result.current.createNote({
        title: 'My Title',
        content: 'This is my note content',
        tags: 'tag1, tag2',
      })

      expect(mockGenerate).not.toHaveBeenCalled()
      expect(note.title).toBe('My Title')
      expect(note.tags).toBe('tag1, tag2')
    })

    it('should handle generation failure gracefully', async () => {
      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const note = await result.current.createNote({
        title: '',
        content: 'This is my note content',
        tags: '',
      })

      expect(mockGenerate).toHaveBeenCalledWith('This is my note content')
      // Should use empty strings when generation fails
      expect(note.title).toBe('')
      expect(note.tags).toBe('')
    })

    it('should treat whitespace-only title as empty', async () => {
      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce({
        title: 'Generated Title',
        tags: ['tag1'],
      })

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const note = await result.current.createNote({
        title: '   \n  ',
        content: 'This is my note content',
        tags: 'existing-tag',
      })

      expect(mockGenerate).toHaveBeenCalled()
      expect(note.title).toBe('Generated Title')
    })
  })

  describe('updateNote', () => {
    it('should auto-generate title when updated title is empty', async () => {
      // First create a note
      await db.notes.add({
        id: 'test-1',
        sourceId: 'test-source',
        title: 'Original Title',
        content: 'Original content',
        tags: 'tag1',
        createdAt: '2026-01-11T00:00:00.000Z',
        updatedAt: '2026-01-11T00:00:00.000Z',
      })

      // Mock getNotesSheet to return the note for update
      const { getNotesSheet } = await import('@/lib/notes-api')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(getNotesSheet).mockReturnValue({
        createRow: vi.fn(async (data: any) => ({ rowIndex: 2, data })),
        updateRow: vi.fn(async (_rowIndex: number, data: any) => data),
        getRows: vi.fn(async () => [{ id: 'test-1', title: 'Original Title' }]) as any,
        deleteRow: vi.fn(),
      })

      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce({
        title: 'Generated Title',
        tags: ['generated1'],
      })

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updated = await result.current.updateNote({
        id: 'test-1',
        title: '',
        content: 'Updated content',
      })

      expect(mockGenerate).toHaveBeenCalledWith('Updated content')
      expect(updated.title).toBe('Generated Title')
    })

    it('should auto-generate tags when updated tags are empty', async () => {
      // First create a note
      await db.notes.add({
        id: 'test-1',
        sourceId: 'test-source',
        title: 'Title',
        content: 'Content',
        tags: 'tag1',
        createdAt: '2026-01-11T00:00:00.000Z',
        updatedAt: '2026-01-11T00:00:00.000Z',
      })

      // Mock getNotesSheet to return the note for update
      const { getNotesSheet } = await import('@/lib/notes-api')
      vi.mocked(getNotesSheet).mockReturnValue({
        createRow: vi.fn(async (data) => ({ rowIndex: 2, data })),
        updateRow: vi.fn(async (_rowIndex, data) => data),
        getRows: vi.fn(async () => [{ id: 'test-1', title: 'Title' }]) as any,
        deleteRow: vi.fn(),
      })

      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce({
        title: 'Generated Title',
        tags: ['generated1', 'generated2'],
      })

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updated = await result.current.updateNote({
        id: 'test-1',
        tags: '',
      })

      expect(mockGenerate).toHaveBeenCalledWith('Content')
      expect(updated.tags).toBe('generated1, generated2')
    })

    it('should not auto-generate when title and tags are not empty', async () => {
      // First create a note
      await db.notes.add({
        id: 'test-1',
        sourceId: 'test-source',
        title: 'Title',
        content: 'Content',
        tags: 'tag1',
        createdAt: '2026-01-11T00:00:00.000Z',
        updatedAt: '2026-01-11T00:00:00.000Z',
      })

      // Mock getNotesSheet to return the note for update
      const { getNotesSheet } = await import('@/lib/notes-api')
      vi.mocked(getNotesSheet).mockReturnValue({
        createRow: vi.fn(async (data) => ({ rowIndex: 2, data })),
        updateRow: vi.fn(async (_rowIndex, data) => data),
        getRows: vi.fn(async () => [{ id: 'test-1', title: 'Title' }]) as any,
        deleteRow: vi.fn(),
      })

      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updated = await result.current.updateNote({
        id: 'test-1',
        title: 'New Title',
        tags: 'new-tag',
      })

      expect(mockGenerate).not.toHaveBeenCalled()
      expect(updated.title).toBe('New Title')
      expect(updated.tags).toBe('new-tag')
    })

    it('should handle generation failure gracefully on update', async () => {
      // First create a note
      await db.notes.add({
        id: 'test-1',
        sourceId: 'test-source',
        title: 'Title',
        content: 'Content',
        tags: 'tag1',
        createdAt: '2026-01-11T00:00:00.000Z',
        updatedAt: '2026-01-11T00:00:00.000Z',
      })

      // Mock getNotesSheet to return the note for update
      const { getNotesSheet } = await import('@/lib/notes-api')
      vi.mocked(getNotesSheet).mockReturnValue({
        createRow: vi.fn(async (data) => ({ rowIndex: 2, data })),
        updateRow: vi.fn(async (_rowIndex, data) => data),
        getRows: vi.fn(async () => [{ id: 'test-1', title: 'Title' }]) as any,
        deleteRow: vi.fn(),
      })

      const mockGenerate = vi.mocked(generateMetadataModule.generateMetadata)
      mockGenerate.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useNotes({ spreadsheetId: 'test-sheet-id' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updated = await result.current.updateNote({
        id: 'test-1',
        title: '',
        tags: '',
      })

      expect(mockGenerate).toHaveBeenCalled()
      // Should use empty strings when generation fails
      expect(updated.title).toBe('')
      expect(updated.tags).toBe('')
    })
  })
})

export interface Note {
  id: string
  sourceId: string
  title: string
  content: string
  tags: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface PendingSync {
  id: string
  sourceId: string
  noteId: string
  operation: 'create' | 'update' | 'delete'
  data?: Note
  timestamp: string
}

export interface NoteSource {
  id: string
  name: string
  spreadsheetId: string
}

export type SortOrder = 'newest' | 'oldest'

export interface Note {
  id: string
  title: string
  content: string
  tags: string
  createdAt: string
  updatedAt: string
}

export interface PendingSync {
  id: string
  noteId: string
  operation: 'create' | 'update' | 'delete'
  data?: Note
  timestamp: string
}

export type SortOrder = 'newest' | 'oldest'

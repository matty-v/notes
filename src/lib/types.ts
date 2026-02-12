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

export interface NoteSource {
  id: string
  name: string
  spreadsheetId: string
}

export type SortOrder = 'newest' | 'oldest'

export type ViewMode = 'list' | 'grid' | 'kanban'

export interface BoardColumn {
  id: string
  tag: string      // The tag that determines column membership
  name: string     // Display name (can differ from tag)
  order: number
}

export interface KanbanBoardConfig {
  sourceId: string
  columns: BoardColumn[]
  defaultColumn: {
    name: string
    visible: boolean
  }
}

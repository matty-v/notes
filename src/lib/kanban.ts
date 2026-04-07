import type { Note, KanbanBoardConfig } from '@/lib/types'

/**
 * Organize a flat list of notes into kanban columns based on the
 * board configuration. Pure function — extracted from KanbanBoardView so
 * the logic is testable in isolation without rendering the whole board.
 *
 * Assignment rules:
 * - Notes are matched against configured columns in order (lowest first).
 *   The first column whose tag is present in `note.tags` wins; the note
 *   is appended to that column and skipped for further matching.
 * - If a note has no matching column tag AND the default column is
 *   visible, it lands in `__default__`. Notes whose only tags are *other*
 *   column tags (no match for any current column) intentionally do NOT
 *   land in default — they belong to a column that isn't currently
 *   shown.
 */
export function organizeNotesIntoColumns(
  notes: Note[],
  config: KanbanBoardConfig
): Map<string, Note[]> {
  const columnMap = new Map<string, Note[]>()

  // Initialize all configured columns
  config.columns.forEach((col) => columnMap.set(col.id, []))

  // Initialize default column if visible
  if (config.defaultColumn.visible) {
    columnMap.set('__default__', [])
  }

  // Get all column tags for quick lookup
  const columnTags = new Set(config.columns.map((col) => col.tag))

  for (const note of notes) {
    const noteTags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)

    // Find first matching column by order
    let assigned = false
    for (const column of [...config.columns].sort((a, b) => a.order - b.order)) {
      if (noteTags.includes(column.tag)) {
        columnMap.get(column.id)!.push(note)
        assigned = true
        break
      }
    }

    // If no match and default column visible, check if note has any column tags
    // If it doesn't have any column tags, add to default
    if (!assigned && config.defaultColumn.visible) {
      const hasColumnTag = noteTags.some((tag) => columnTags.has(tag))
      if (!hasColumnTag) {
        columnMap.get('__default__')!.push(note)
      }
    }
  }

  return columnMap
}

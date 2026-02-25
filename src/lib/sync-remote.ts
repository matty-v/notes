import { getNotesSheet } from './notes-api'
import { getRowIndex, setRowIndex, deleteRowIndex } from './row-index-cache'
import type { Note } from './types'

/**
 * Resolve the row index for a note, using cache first, falling back to getRows() lookup.
 */
async function resolveRowIndex(
  noteId: string,
  spreadsheetId: string
): Promise<number> {
  const cached = getRowIndex(noteId)
  if (cached !== undefined) return cached

  const notesSheet = getNotesSheet(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await notesSheet.getRows()) as any[]
  const index = rows.findIndex((r) => r.id === noteId)
  if (index < 0) {
    throw new Error('Note not found in remote sheet')
  }
  const rowIndex = index + 2
  setRowIndex(noteId, rowIndex)
  return rowIndex
}

/**
 * Sync a newly created note to Google Sheets.
 * Returns the row index from the createRow response.
 */
export async function syncCreateToRemote(
  note: Note,
  spreadsheetId: string
): Promise<{ rowIndex: number }> {
  const notesSheet = getNotesSheet(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await notesSheet.createRow(note as any)
  setRowIndex(note.id, result.rowIndex)
  return { rowIndex: result.rowIndex }
}

/**
 * Sync an updated note to Google Sheets.
 */
export async function syncUpdateToRemote(
  note: Note,
  spreadsheetId: string
): Promise<void> {
  const rowIndex = await resolveRowIndex(note.id, spreadsheetId)
  const notesSheet = getNotesSheet(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await notesSheet.updateRow(rowIndex, note as any)
}

/**
 * Sync a soft-deleted note to Google Sheets.
 */
export async function syncDeleteToRemote(
  deletedNote: Note,
  spreadsheetId: string
): Promise<void> {
  const rowIndex = await resolveRowIndex(deletedNote.id, spreadsheetId)
  const notesSheet = getNotesSheet(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await notesSheet.updateRow(rowIndex, deletedNote as any)
  deleteRowIndex(deletedNote.id)
}

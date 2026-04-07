import { getNotesSheet } from './notes-api'
import {
  getRowIndex,
  setRowIndex,
  deleteRowIndex,
  shiftAfterDelete,
} from './row-index-cache'
import type { Note } from './types'

/**
 * Resolve the row index for a note, using cache first, falling back to getRows() lookup.
 */
async function resolveRowIndex(
  noteId: string,
  spreadsheetId: string
): Promise<number> {
  const cached = getRowIndex(spreadsheetId, noteId)
  if (cached !== undefined) return cached

  const notesSheet = getNotesSheet(spreadsheetId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await notesSheet.getRows()) as any[]
  const index = rows.findIndex((r) => r.id === noteId)
  if (index < 0) {
    throw new Error('Note not found in remote sheet')
  }
  const rowIndex = index + 2
  setRowIndex(spreadsheetId, noteId, rowIndex)
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
  setRowIndex(spreadsheetId, note.id, result.rowIndex)
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
 * Sync a deletion to Google Sheets.
 *
 * IMPORTANT: We hard-delete the row instead of soft-deleting via
 * updateRow({...note, deletedAt}). The sheets-db-api `updateRow` reads the
 * existing column headers and silently drops any field whose key is not
 * already a header — and the default SHEETS_CONFIG does not include a
 * `deletedAt` column. A soft delete via updateRow therefore writes the same
 * row back unchanged, and the note resurrects on the next refresh.
 *
 * Hard deletion via deleteRow removes the row entirely; the local IndexedDB
 * cache already filters by deletedAt at read time and is overwritten on the
 * next refreshCacheFromRemote, so no UI churn.
 */
export async function syncDeleteToRemote(
  deletedNote: Note,
  spreadsheetId: string
): Promise<void> {
  const rowIndex = await resolveRowIndex(deletedNote.id, spreadsheetId)
  const notesSheet = getNotesSheet(spreadsheetId)
  await notesSheet.deleteRow(rowIndex)
  deleteRowIndex(spreadsheetId, deletedNote.id)
  // The deleted row's successors all shifted up by one in the sheet — keep
  // any cached entries for the same spreadsheet in sync so subsequent
  // updates don't target stale row indices.
  shiftAfterDelete(spreadsheetId, rowIndex)
}

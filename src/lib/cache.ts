import { db } from './db'
import { getNotesSheet, isApiReachable } from './notes-api'
import { populateFromRows } from './row-index-cache'
import type { Note } from './types'

/**
 * Refresh local IndexedDB cache from remote Google Sheets
 * This replaces local cache with fresh data from the source of truth
 */
export async function refreshCacheFromRemote(
  sourceId: string,
  spreadsheetId: string
): Promise<void> {
  if (!(await isApiReachable())) {
    throw new Error('API is not reachable')
  }

  const notesSheet = getNotesSheet(spreadsheetId)

  // Fetch all remote notes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteNotes = (await notesSheet.getRows()) as any[]

  // Populate row index cache (rows are 0-indexed, row 1 is headers)
  populateFromRows(spreadsheetId, remoteNotes)

  // Clear existing notes for this source
  await db.notes.where('sourceId').equals(sourceId).delete()

  // Write fresh data to cache. Skip soft-deleted notes — they exist on the
  // remote sheet for tombstoning but should not appear in the local cache,
  // matching resetCacheForSource behavior. The use-notes queryFn already
  // filters deletedAt at read time, so writing them here was pure waste.
  for (const remote of remoteNotes) {
    if (!remote.id || remote.deletedAt) continue

    const note: Note = {
      ...remote,
      sourceId,
    } as Note

    await db.notes.put(note)
  }
}

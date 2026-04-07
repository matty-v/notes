/**
 * In-memory cache mapping note IDs to their Google Sheets row indices.
 * Eliminates the extra getRows() call needed before update/delete operations.
 *
 * Entries are scoped by spreadsheetId so two sources that happen to share a
 * note id (e.g. via CSV import) cannot collide and corrupt each other's rows.
 */

const cache = new Map<string, number>()

function makeKey(spreadsheetId: string, noteId: string): string {
  return `${spreadsheetId}:${noteId}`
}

export function getRowIndex(spreadsheetId: string, noteId: string): number | undefined {
  return cache.get(makeKey(spreadsheetId, noteId))
}

export function setRowIndex(spreadsheetId: string, noteId: string, rowIndex: number): void {
  cache.set(makeKey(spreadsheetId, noteId), rowIndex)
}

export function deleteRowIndex(spreadsheetId: string, noteId: string): void {
  cache.delete(makeKey(spreadsheetId, noteId))
}

/**
 * Populate the cache from an array of rows returned by getRows() for the given
 * spreadsheet. Existing entries for the same spreadsheet are dropped first;
 * entries belonging to other spreadsheets are preserved.
 *
 * Rows are 0-indexed from the API, but row 1 is headers, so row index = arrayIndex + 2.
 */
export function populateFromRows(
  spreadsheetId: string,
  rows: Array<{ id?: string }>
): void {
  const prefix = `${spreadsheetId}:`
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
  rows.forEach((row, index) => {
    if (row.id) {
      cache.set(makeKey(spreadsheetId, row.id), index + 2)
    }
  })
}

export function clearRowIndexCache(): void {
  cache.clear()
}

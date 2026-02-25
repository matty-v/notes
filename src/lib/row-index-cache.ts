/**
 * In-memory cache mapping note IDs to their Google Sheets row indices.
 * Eliminates the extra getRows() call needed before update/delete operations.
 */

const cache = new Map<string, number>()

export function getRowIndex(noteId: string): number | undefined {
  return cache.get(noteId)
}

export function setRowIndex(noteId: string, rowIndex: number): void {
  cache.set(noteId, rowIndex)
}

export function deleteRowIndex(noteId: string): void {
  cache.delete(noteId)
}

/**
 * Populate the cache from an array of rows returned by getRows().
 * Rows are 0-indexed from the API, but row 1 is headers, so row index = arrayIndex + 2.
 */
export function populateFromRows(rows: Array<{ id?: string }>): void {
  cache.clear()
  rows.forEach((row, index) => {
    if (row.id) {
      cache.set(row.id, index + 2)
    }
  })
}

export function clearRowIndexCache(): void {
  cache.clear()
}

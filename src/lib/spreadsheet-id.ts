/**
 * Extract a Google Sheets spreadsheet id from arbitrary user input.
 *
 * Accepts either a bare id (returned unchanged) or a full Sheets URL of the
 * form `https://docs.google.com/spreadsheets/d/<id>/edit#gid=...`. The
 * `/spreadsheets/d/<id>` segment is the canonical anchor — anything matching
 * that pattern returns just the captured id, otherwise the input is passed
 * through (trimmed) so existing bare-id pasters keep working.
 */
const SHEETS_URL_RE = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/

export function extractSpreadsheetId(input: string): string {
  const match = input.match(SHEETS_URL_RE)
  return match ? match[1] : input.trim()
}

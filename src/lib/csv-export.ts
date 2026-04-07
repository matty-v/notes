import { db } from '@/lib/db'

// Characters that trigger formula execution in Excel/Google Sheets when leading
// a CSV cell. Prefixing with a single quote neutralizes them. See CWE-1236.
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']

function escapeCsvValue(value: string): string {
  // Defend against CSV formula injection by prefixing risky leading chars with `'`.
  let safe = value
  if (safe.length > 0 && FORMULA_TRIGGERS.includes(safe[0])) {
    safe = `'${safe}`
  }
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

export async function exportNotesForSource(sourceId: string, sourceName: string): Promise<number> {
  const notes = await db.notes.where('sourceId').equals(sourceId).toArray()

  const headers = ['id', 'title', 'content', 'tags', 'createdAt', 'updatedAt', 'deletedAt']
  const rows = notes.map((note) =>
    [
      escapeCsvValue(note.id),
      escapeCsvValue(note.title),
      escapeCsvValue(note.content),
      escapeCsvValue(note.tags),
      escapeCsvValue(note.createdAt),
      escapeCsvValue(note.updatedAt),
      escapeCsvValue(note.deletedAt ?? ''),
    ].join(',')
  )

  // RFC 4180 mandates CRLF line terminators. Most modern parsers tolerate
  // LF, but some (Tableau, certain Power Query versions) require CRLF.
  const csv = [headers.join(','), ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().split('T')[0]
  // Sanitize sourceName for use in a filename, then collapse runs of `-`,
  // trim leading/trailing dashes, and fall back to `source` if empty so
  // names like "日本語" or "###" don't yield "notes-export--2026-04-07.csv".
  const safeName =
    sourceName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'source'
  const filename = `notes-export-${safeName}-${date}.csv`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return notes.length
}

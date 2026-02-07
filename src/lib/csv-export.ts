import { db } from '@/lib/db'

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().split('T')[0]
  const safeName = sourceName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
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

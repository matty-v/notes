import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'
import type { Note } from '@/lib/types'

export interface Template {
  id: string
  name: string
  note: Note
}

export function useTemplates(sourceId?: string) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', sourceId],
    queryFn: async () => {
      let notes = await db.notes.toArray()
      notes = notes.filter((n) => !n.deletedAt)
      if (sourceId) {
        notes = notes.filter((n) => n.sourceId === sourceId)
      }

      // Extract templates from notes with "template:<name>" tags
      const templatesList: Template[] = []
      for (const note of notes) {
        const tags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
        for (const tag of tags) {
          if (tag.startsWith('template:')) {
            const name = tag.substring('template:'.length)
            if (name) {
              templatesList.push({
                id: note.id,
                name,
                note,
              })
            }
          }
        }
      }

      // Sort alphabetically by template name
      return templatesList.sort((a, b) => a.name.localeCompare(b.name))
    },
  })

  return { templates, isLoading }
}

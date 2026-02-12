import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'

export function useTags(sourceId?: string) {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', sourceId],
    queryFn: async () => {
      let notes = await db.notes.toArray()
      notes = notes.filter((n) => !n.deletedAt)
      if (sourceId) {
        notes = notes.filter((n) => n.sourceId === sourceId)
      }
      const tagSet = new Set<string>()
      for (const note of notes) {
        const noteTags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
        noteTags.forEach((tag) => tagSet.add(tag))
      }
      return Array.from(tagSet).sort()
    },
  })
  return { tags, isLoading }
}

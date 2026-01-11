import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'

export function useTags() {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const notes = await db.notes.toArray()
      const tagSet = new Set<string>()

      for (const note of notes) {
        const noteTags = note.tags.split(',').map((t) => t.trim()).filter(Boolean)
        noteTags.forEach((tag) => tagSet.add(tag))
      }

      return Array.from(tagSet).sort()
    },
  })

  return { tags, isLoading }
}

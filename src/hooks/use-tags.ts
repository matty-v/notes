import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'

export function useTags(sourceId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['tags', sourceId],
    queryFn: async () => {
      let notes = await db.notes.toArray()
      notes = notes.filter((n) => !n.deletedAt)
      if (sourceId) {
        notes = notes.filter((n) => n.sourceId === sourceId)
      }
      const counts: Record<string, number> = {}
      for (const note of notes) {
        const noteTags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
        for (const tag of noteTags) {
          counts[tag] = (counts[tag] || 0) + 1
        }
      }
      // Sort by count descending, then alphabetically
      const sorted = Object.keys(counts).sort((a, b) => {
        const diff = counts[b] - counts[a]
        return diff !== 0 ? diff : a.localeCompare(b)
      })
      return { tags: sorted, tagCounts: counts }
    },
  })
  return {
    tags: data?.tags ?? [],
    tagCounts: data?.tagCounts ?? {},
    isLoading,
  }
}

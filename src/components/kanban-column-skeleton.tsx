import { Skeleton } from '@/components/ui/skeleton'
import { NoteCardSkeleton } from '@/components/note-card-skeleton'

export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col w-[320px] h-full flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 mb-3 rounded-lg bg-[rgba(18,24,33,0.8)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_20px_rgba(0,212,255,0.05)]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-8 rounded-md" />
        </div>
      </div>
      {/* Cards */}
      <div className="flex-1 px-2 space-y-3">
        <NoteCardSkeleton variant="grid" />
        <NoteCardSkeleton variant="grid" />
        <NoteCardSkeleton variant="grid" />
      </div>
    </div>
  )
}

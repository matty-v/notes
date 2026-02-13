import { Skeleton } from '@/components/ui/skeleton'

interface NoteCardSkeletonProps {
  variant?: 'list' | 'grid'
}

export function NoteCardSkeleton({ variant = 'list' }: NoteCardSkeletonProps) {
  const isGrid = variant === 'grid'
  const cardPadding = isGrid ? 'p-3' : 'p-4'
  const minHeight = isGrid ? 'min-h-[200px]' : ''

  return (
    <div
      className={`${cardPadding} rounded-xl bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_40px_rgba(0,212,255,0.05),inset_0_1px_0_rgba(255,255,255,0.05)] ${minHeight} flex flex-col`}
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="mt-2 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        {!isGrid && <Skeleton className="h-3 w-2/3" />}
      </div>
      <div className="mt-3 flex gap-1">
        <Skeleton className="h-5 w-12 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>
  )
}

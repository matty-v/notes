import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NoteSource } from '@/lib/types'

interface SourceSelectorProps {
  sources: NoteSource[]
  activeSourceId: string | null
  onSourceChange: (sourceId: string) => void
}

export function SourceSelector({ sources, activeSourceId, onSourceChange }: SourceSelectorProps) {
  if (sources.length <= 1) return null

  return (
    <Select value={activeSourceId || ''} onValueChange={onSourceChange}>
      <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs bg-[rgba(18,24,33,0.5)] border-[rgba(100,150,255,0.2)]">
        <SelectValue placeholder="Select source" />
      </SelectTrigger>
      <SelectContent>
        {sources.map((source) => (
          <SelectItem key={source.id} value={source.id}>
            {source.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

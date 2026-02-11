import { LayoutList, LayoutGrid, Columns3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/lib/types'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  onConfigureKanban?: () => void
}

export function ViewModeToggle({ value, onChange, onConfigureKanban }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange('list')}
          className={`transition-all ${
            value === 'list'
              ? 'bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] text-[var(--accent-cyan)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="List view"
          title="List view"
        >
          <LayoutList className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange('grid')}
          className={`transition-all ${
            value === 'grid'
              ? 'bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] text-[var(--accent-cyan)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Grid view"
          title="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange('kanban')}
          className={`transition-all ${
            value === 'kanban'
              ? 'bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] text-[var(--accent-cyan)]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Kanban view"
          title="Kanban view"
        >
          <Columns3 className="h-4 w-4" />
        </Button>
      </div>

      {value === 'kanban' && onConfigureKanban && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onConfigureKanban}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Configure Kanban board"
          title="Configure Kanban board"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

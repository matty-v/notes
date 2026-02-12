import { useState } from 'react'
import { X, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTags } from '@/hooks/use-tags'
import type { KanbanBoardConfig } from '@/lib/types'

interface KanbanConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: KanbanBoardConfig
  sourceId: string
  onAddColumn: (tag: string, name?: string) => void
  onRemoveColumn: (columnId: string) => void
  onReorderColumn: (columnId: string, direction: 'up' | 'down') => void
  onUpdateDefaultColumn: (updates: Partial<KanbanBoardConfig['defaultColumn']>) => void
}

export function KanbanConfigDialog({
  open,
  onOpenChange,
  config,
  sourceId,
  onAddColumn,
  onRemoveColumn,
  onReorderColumn,
  onUpdateDefaultColumn,
}: KanbanConfigDialogProps) {
  const { tags: availableTags } = useTags(sourceId)
  const [selectedTag, setSelectedTag] = useState('')
  const [customName, setCustomName] = useState('')

  const usedTags = new Set(config.columns.map((col) => col.tag))
  const unusedTags = availableTags.filter((tag) => !usedTags.has(tag))

  const handleAddColumn = () => {
    if (!selectedTag) return
    onAddColumn(selectedTag, customName || undefined)
    setSelectedTag('')
    setCustomName('')
  }

  const sortedColumns = [...config.columns].sort((a, b) => a.order - b.order)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="glow-purple">Configure Kanban Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Columns */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-cyan)]">
              Board Columns
            </h3>
            {sortedColumns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No columns configured. Add columns from your tags below.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedColumns.map((column, index) => (
                  <div
                    key={column.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {column.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tag: {column.tag}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReorderColumn(column.id, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReorderColumn(column.id, 'down')}
                        disabled={index === sortedColumns.length - 1}
                        className="h-8 w-8 p-0"
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveColumn(column.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Remove column"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Column */}
          <div className="border-t border-[rgba(100,150,255,0.2)] pt-6">
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-purple)]">
              Add Column
            </h3>
            {unusedTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All available tags are already used as columns. Create notes with new tags to add more columns.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Select Tag
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
                  >
                    <option value="">Choose a tag...</option>
                    {unusedTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Display Name (optional)
                  </label>
                  <Input
                    placeholder="Leave empty to use tag name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleAddColumn}
                  disabled={!selectedTag}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>
            )}
          </div>

          {/* Default Column Settings */}
          <div className="border-t border-[rgba(100,150,255,0.2)] pt-6">
            <h3 className="text-sm font-semibold mb-3 text-[var(--accent-pink)]">
              Uncategorized Notes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show-default-column"
                  checked={config.defaultColumn.visible}
                  onChange={(e) =>
                    onUpdateDefaultColumn({ visible: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[rgba(100,150,255,0.2)] bg-[rgba(18,24,33,0.5)] text-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan)]"
                />
                <label
                  htmlFor="show-default-column"
                  className="text-sm text-foreground cursor-pointer"
                >
                  Show column for notes without configured tags
                </label>
              </div>

              {config.defaultColumn.visible && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Column Name
                  </label>
                  <Input
                    placeholder="Uncategorized"
                    value={config.defaultColumn.name}
                    onChange={(e) =>
                      onUpdateDefaultColumn({ name: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

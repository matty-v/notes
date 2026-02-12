import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NoteForm } from '@/components/note-form'

interface CreateNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; content: string; tags: string }) => Promise<unknown>
  initialTags?: string[]
}

export function CreateNoteModal({ open, onOpenChange, onSubmit, initialTags }: CreateNoteModalProps) {
  const handleSubmit = async (data: { title: string; content: string; tags: string }) => {
    await onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <NoteForm
            key={initialTags?.join(',') ?? ''}
            formId="note-create-form"
            hideActions
            onSubmit={handleSubmit}
            submitLabel="Create"
            initialValues={initialTags?.length ? { title: '', content: '', tags: initialTags } : undefined}
          />
        </div>
        <DialogFooter className="flex !flex-row items-center justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (document.getElementById('note-create-form') as HTMLFormElement)?.requestSubmit()}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

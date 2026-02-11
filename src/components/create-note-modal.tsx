import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NoteForm } from '@/components/note-form'

interface CreateNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; content: string; tags: string }) => Promise<unknown>
}

export function CreateNoteModal({ open, onOpenChange, onSubmit }: CreateNoteModalProps) {
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
          <NoteForm onSubmit={handleSubmit} onCancel={() => onOpenChange(false)} submitLabel="Create" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

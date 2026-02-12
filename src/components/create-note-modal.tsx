import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NoteForm } from '@/components/note-form'
import { TemplateSelector } from '@/components/template-selector'
import { useTemplates } from '@/hooks/use-templates'

interface CreateNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; content: string; tags: string; skipAutoGeneration?: boolean }) => Promise<unknown>
  initialTags?: string[]
  sourceId?: string
}

export function CreateNoteModal({ open, onOpenChange, onSubmit, initialTags, sourceId }: CreateNoteModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank')
  const { templates } = useTemplates(sourceId)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplateId('blank')
    }
  }, [open])

  // Calculate template form values synchronously
  const templateFormValues = (() => {
    if (selectedTemplateId && selectedTemplateId !== 'blank') {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        // Strip "template:<name>" tags from the template's tags
        const tags = (template.note.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => !t.startsWith('template:') && t !== '')

        return {
          title: template.note.title,
          content: template.note.content,
          tags,
        }
      }
    }
    // Reset to blank note or initial tags
    return initialTags?.length ? { title: '', content: '', tags: initialTags } : undefined
  })()

  const handleSubmit = async (data: { title: string; content: string; tags: string }) => {
    await onSubmit({
      ...data,
      skipAutoGeneration: selectedTemplateId !== 'blank' && selectedTemplateId !== '',
    })
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
            key={`${selectedTemplateId}-${initialTags?.join(',') ?? ''}`}
            formId="note-create-form"
            hideActions
            onSubmit={handleSubmit}
            submitLabel="Create"
            initialValues={templateFormValues}
          />
        </div>
        <DialogFooter className="pt-4">
          <div className="flex flex-row items-center justify-between w-full gap-2">
            <div className="w-64">
              <TemplateSelector
                sourceId={sourceId}
                selectedTemplateId={selectedTemplateId}
                onTemplateChange={setSelectedTemplateId}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (document.getElementById('note-create-form') as HTMLFormElement)?.requestSubmit()}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/tag-input'

interface NoteFormProps {
  onSubmit: (data: { title: string; content: string; tags: string }) => Promise<void>
  initialValues?: { title: string; content: string; tags: string[] }
  submitLabel?: string
  onCancel?: () => void
}

export function NoteForm({
  onSubmit,
  initialValues,
  submitLabel = 'Save',
  onCancel,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [content, setContent] = useState(initialValues?.content ?? '')
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags: tags.join(','),
      })
      if (!initialValues) {
        setTitle('')
        setContent('')
        setTags([])
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-card">
      <Input
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Write your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TagInput value={tags} onChange={setTags} />
        </div>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

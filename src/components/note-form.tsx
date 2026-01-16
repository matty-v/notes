import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/tag-input'
import { useVoiceRecording } from '@/hooks/use-voice-recording'

interface NoteFormProps {
  onSubmit: (data: { title: string; content: string; tags: string }) => Promise<unknown>
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
  const [formKey, setFormKey] = useState(0)
  const pendingTagRef = useRef('')

  const { isListening, transcript, error: voiceError, isSupported, startListening, stopListening, resetTranscript } = useVoiceRecording()

  // Append transcript to content when it changes
  useEffect(() => {
    if (transcript) {
      setContent(prev => {
        const newContent = prev ? `${prev} ${transcript}` : transcript
        return newContent
      })
      resetTranscript()
    }
  }, [transcript, resetTranscript])

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return

    // Stop recording if active
    if (isListening) {
      stopListening()
    }

    // Include any pending tag input
    let finalTags = [...tags]
    const pendingTag = pendingTagRef.current.trim().toLowerCase()
    if (pendingTag && !finalTags.includes(pendingTag)) {
      finalTags.push(pendingTag)
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags: finalTags.join(','),
      })
      if (!initialValues) {
        setTitle('')
        setContent('')
        setTags([])
        pendingTagRef.current = ''
        resetTranscript()
        setFormKey((k) => k + 1)
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
      />
      <div className="relative">
        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[80px] px-3 py-2 pr-12 border border-input rounded-md bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ring-offset-background placeholder:text-muted-foreground"
        />
        {isSupported && (
          <Button
            type="button"
            size="icon"
            variant={isListening ? "default" : "ghost"}
            onClick={toggleVoiceRecording}
            className="absolute right-2 top-2"
            title={isListening ? "Stop recording" : "Start voice recording"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {voiceError && (
        <p className="text-sm text-destructive">{voiceError}</p>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TagInput key={formKey} value={tags} onChange={setTags} pendingInputRef={pendingTagRef} />
        </div>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || (!title.trim() && !content.trim())}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

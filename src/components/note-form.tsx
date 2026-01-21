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

    if (isListening) {
      stopListening()
    }

    const pendingTag = pendingTagRef.current.trim().toLowerCase()
    const finalTags = pendingTag && !tags.includes(pendingTag)
      ? [...tags, pendingTag]
      : [...tags]

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
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] shadow-[0_0_40px_rgba(0,212,255,0.05),inset_0_1px_0_rgba(255,255,255,0.05)]">
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
          className="w-full min-h-[80px] px-3 py-2 pr-12 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-foreground text-sm resize-none focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] placeholder:text-muted-foreground transition-all duration-300"
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
        <p className="text-sm text-[var(--accent-pink)]">{voiceError}</p>
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

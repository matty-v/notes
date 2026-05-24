import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Mic, MicOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/tag-input'
import { AISuggestionPanel } from '@/components/ai-suggestion-panel'
import { useVoiceRecording } from '@/hooks/use-voice-recording'
import { useAISuggestions } from '@/hooks/use-ai-suggestions'

interface NoteFormProps {
  onSubmit: (data: { title: string; content: string; tags: string }) => Promise<unknown>
  initialValues?: { title: string; content: string; tags: string[] }
  submitLabel?: string
  onCancel?: () => void
  formId?: string
  hideActions?: boolean
}

export function NoteForm({
  onSubmit,
  initialValues,
  submitLabel = 'Save',
  onCancel,
  formId,
  hideActions,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [content, setContent] = useState(initialValues?.content ?? '')
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const pendingTagRef = useRef('')
  const escapeTabRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null)

  useLayoutEffect(() => {
    if (pendingSelectionRef.current !== null && textareaRef.current) {
      const { start, end } = pendingSelectionRef.current
      pendingSelectionRef.current = null
      textareaRef.current.setSelectionRange(start, end)
    }
  })

  const { isListening, transcript, error: voiceError, isSupported, startListening, stopListening, resetTranscript } = useVoiceRecording()
  const { suggest, suggestion, isLoading: isSuggesting, error: suggestError, clear: clearSuggestions } = useAISuggestions()

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

  const handleSuggest = () => {
    suggest({
      content,
      existingTitle: title || undefined,
      existingTags: tags.length > 0 ? tags : undefined,
    })
  }

  const handleAcceptTitle = (suggestedTitle: string) => {
    setTitle(suggestedTitle)
  }

  const handleAcceptTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const handleAcceptAllTags = (newTags: string[]) => {
    const merged = [...tags]
    for (const tag of newTags) {
      if (!merged.includes(tag)) {
        merged.push(tag)
      }
    }
    setTags(merged)
  }

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      escapeTabRef.current = true
      return
    }

    if (e.key !== 'Tab') {
      escapeTabRef.current = false
      return
    }

    if (escapeTabRef.current) {
      escapeTabRef.current = false
      return
    }

    e.preventDefault()

    const textarea = e.currentTarget
    const { value, selectionStart, selectionEnd } = textarea

    if (selectionStart === selectionEnd) {
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
        const lineText = value.slice(lineStart)
        const removed = lineText.match(/^ {1,2}/)?.[0] ?? ''
        setContent(value.slice(0, lineStart) + value.slice(lineStart + removed.length))
        const newPos = Math.max(lineStart, selectionStart - removed.length)
        pendingSelectionRef.current = { start: newPos, end: newPos }
      } else {
        setContent(value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd))
        const newPos = selectionStart + 2
        pendingSelectionRef.current = { start: newPos, end: newPos }
      }
    } else {
      const lines = value.split('\n')
      let charPos = 0
      let deltaBeforeStart = 0
      let totalDelta = 0
      const newLines = lines.map((line) => {
        const lineStart = charPos
        const lineEnd = charPos + line.length
        charPos = lineEnd + 1
        const overlaps = lineEnd >= selectionStart && lineStart < selectionEnd
        if (!overlaps) return line
        if (e.shiftKey) {
          const removed = line.match(/^ {1,2}/)?.[0] ?? ''
          const removedLen = removed.length
          if (lineStart + removedLen <= selectionStart) {
            deltaBeforeStart -= removedLen
          } else if (lineStart <= selectionStart) {
            deltaBeforeStart -= (selectionStart - lineStart)
          }
          totalDelta -= removedLen
          return line.slice(removedLen)
        } else {
          if (lineStart <= selectionStart) deltaBeforeStart += 2
          totalDelta += 2
          return '  ' + line
        }
      })
      setContent(newLines.join('\n'))
      pendingSelectionRef.current = {
        start: Math.max(0, selectionStart + deltaBeforeStart),
        end: Math.max(0, selectionEnd + totalDelta),
      }
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
        // Canonical join format: `", "` with space for sheet readability.
        // kanban-board-view writes the same format on drag-update.
        tags: finalTags.join(', '),
      })
      if (!initialValues) {
        setTitle('')
        setContent('')
        setTags([])
        pendingTagRef.current = ''
        resetTranscript()
        clearSuggestions()
        setFormKey((k) => k + 1)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="relative">
        <textarea
          ref={textareaRef}
          placeholder="Write your note... (supports Markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleContentKeyDown}
          className="w-full min-h-[200px] px-3 py-2 pr-12 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-foreground text-sm resize-vertical focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] placeholder:text-muted-foreground transition-all duration-300"
        />
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          {isSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? "default" : "ghost"}
              onClick={toggleVoiceRecording}
              title={isListening ? "Stop recording" : "Start voice recording"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleSuggest}
            disabled={!content.trim() || isSuggesting}
            title="Suggest title & tags with AI"
          >
            <Sparkles className="h-4 w-4 text-[var(--accent-cyan)]" />
          </Button>
        </div>
      </div>
      {voiceError && (
        <p className="text-sm text-[var(--accent-pink)]">{voiceError}</p>
      )}
      <AISuggestionPanel
        suggestion={suggestion}
        isLoading={isSuggesting}
        error={suggestError}
        currentTitle={title}
        currentTags={tags}
        onAcceptTitle={handleAcceptTitle}
        onAcceptTag={handleAcceptTag}
        onAcceptAllTags={handleAcceptAllTags}
        onDismiss={clearSuggestions}
      />
      <TagInput key={formKey} value={tags} onChange={setTags} pendingInputRef={pendingTagRef} />
      {!hideActions && (
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || (!title.trim() && !content.trim())}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                Saving...
              </>
            ) : submitLabel}
          </Button>
        </div>
      )}
    </form>
  )
}

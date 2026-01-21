import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { useTags } from '@/hooks/use-tags'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  pendingInputRef?: React.MutableRefObject<string>
}

export function TagInput({ value, onChange, placeholder = 'Add tags...', pendingInputRef }: TagInputProps) {
  const [input, setInput] = useState('')

  if (pendingInputRef) {
    pendingInputRef.current = input
  }
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { tags: allTags } = useTags()

  const suggestions = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(input.toLowerCase()) &&
      !value.includes(tag)
  )

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
    setShowSuggestions(false)
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input) addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] min-h-[42px] focus-within:border-[var(--accent-cyan)] focus-within:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-sm rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[var(--accent-cyan)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-[var(--accent-pink)] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[rgba(18,24,33,0.95)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] rounded-lg shadow-[0_0_40px_rgba(0,212,255,0.1)]">
          {suggestions.slice(0, 5).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-[rgba(0,212,255,0.1)] hover:text-[var(--accent-cyan)] transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useCallback } from 'react'
import { generateMetadata } from '@/services/claude/generateMetadata'

interface SuggestInput {
  content: string
  existingTitle?: string
  existingTags?: string[]
}

interface Suggestion {
  title: string
  tags: string[]
}

export function useAISuggestions() {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const suggest = useCallback(async (input: SuggestInput) => {
    setIsLoading(true)
    setSuggestion(null)
    try {
      const result = await generateMetadata({
        content: input.content,
        existingTitle: input.existingTitle,
        existingTags: input.existingTags,
      })
      if (result) {
        setSuggestion(result)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setSuggestion(null)
  }, [])

  return { suggest, suggestion, isLoading, clear }
}

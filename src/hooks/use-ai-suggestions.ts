import { useState, useCallback } from 'react'
import { generateMetadata } from '@/services/claude/generateMetadata'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'

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
  const [error, setError] = useState<string | null>(null)

  const suggest = useCallback(async (input: SuggestInput) => {
    setSuggestion(null)
    setError(null)

    // Pre-flight check for the most actionable failure: missing API key.
    // generateMetadata silently returns null in this case, which would
    // otherwise leave the user staring at a stopped spinner with no clue.
    const hasApiKey =
      Boolean(localStorage.getItem(LOCAL_STORAGE_KEYS.ANTHROPIC_API_KEY)) ||
      Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)
    if (!hasApiKey) {
      setError('Add your Anthropic API key in Settings to enable suggestions.')
      return
    }

    setIsLoading(true)
    try {
      const result = await generateMetadata({
        content: input.content,
        existingTitle: input.existingTitle,
        existingTags: input.existingTags,
      })
      if (result) {
        setSuggestion(result)
      } else {
        // generateMetadata swallows network/parse/validation errors and
        // returns null. We can't distinguish them from here, so surface a
        // generic-but-actionable message and let the user retry.
        setError("Couldn't generate suggestions. Try again or check the console.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setSuggestion(null)
    setError(null)
  }, [])

  return { suggest, suggestion, isLoading, error, clear }
}

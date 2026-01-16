/**
 * Service for generating note titles and tags using Claude API
 */

import { LOCAL_STORAGE_KEYS } from '@/config/constants'

interface GeneratedMetadata {
  title: string
  tags: string[]
}

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeResponse {
  content: Array<{
    type: string
    text: string
  }>
}

/**
 * Generates title and tags for a note based on its content
 * @param content The note content to analyze
 * @returns Generated title and tags, or null if generation fails
 */
export async function generateMetadata(
  content: string
): Promise<GeneratedMetadata | null> {
  // Don't attempt generation if content is empty
  if (!content || content.trim().length === 0) {
    return null
  }

  // Try to get API key from localStorage first, then fall back to env variable
  const apiKey =
    localStorage.getItem(LOCAL_STORAGE_KEYS.ANTHROPIC_API_KEY) ||
    import.meta.env.VITE_ANTHROPIC_API_KEY

  // If API key is not configured, silently skip generation
  if (!apiKey) {
    console.warn('Anthropic API key not configured. Skipping auto-generation.')
    return null
  }

  try {
    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `Analyze the following note content and generate a concise title and 2-5 relevant tags.

Note content:
${content}

Respond with a JSON object in this exact format:
{
  "title": "A concise, descriptive title (max 60 characters)",
  "tags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- Title should capture the main topic or purpose
- Tags should be single words or short phrases (lowercase, no spaces)
- Tags should represent themes, topics, or key concepts
- For very short notes (< 50 chars), use the content itself as inspiration for the title
- Keep it simple and focused

Respond ONLY with the JSON object, no other text.`,
      },
    ]

    const response = await fetch('https://proxy-g56q77hy2a-uc.a.run.app/api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 256,
        messages,
      }),
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText)
      return null
    }

    const data: ClaudeResponse = await response.json()

    // Extract the text content from the response
    const textContent = data.content.find((c) => c.type === 'text')?.text

    if (!textContent) {
      console.error('No text content in Claude response')
      return null
    }

    // Parse the JSON response
    const generated = JSON.parse(textContent) as GeneratedMetadata

    // Validate the response structure
    if (!generated.title || !Array.isArray(generated.tags)) {
      console.error('Invalid response structure from Claude')
      return null
    }

    return generated
  } catch (error) {
    // Log error but don't throw - we want save to succeed even if generation fails
    console.error('Error generating metadata with Claude:', error)
    return null
  }
}

/**
 * Checks if a title should be auto-generated
 * @param title The current title value
 * @returns true if title is empty or whitespace-only
 */
export function shouldGenerateTitle(title: string | undefined): boolean {
  return !title || title.trim() === ''
}

/**
 * Checks if tags should be auto-generated
 * @param tags The current tags value (comma-separated string)
 * @returns true if tags are empty
 */
export function shouldGenerateTags(tags: string | undefined): boolean {
  return !tags || tags.trim() === ''
}

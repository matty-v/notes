/**
 * Service for generating note titles and tags using Claude API
 */

import { LOCAL_STORAGE_KEYS } from '@/config/constants'

interface GeneratedMetadata {
  title: string
  tags: string[]
}

interface GenerateMetadataInput {
  content: string
  existingTitle?: string
  existingTags?: string[]
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
 * @param input The note content and optional existing metadata to build upon
 * @returns Generated title and tags, or null if generation fails
 */
export async function generateMetadata(
  input: GenerateMetadataInput
): Promise<GeneratedMetadata | null> {
  const { content, existingTitle, existingTags } = input

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

  const hasExistingTitle = existingTitle && existingTitle.trim().length > 0
  const hasExistingTags = existingTags && existingTags.length > 0

  let contextBlock = ''
  if (hasExistingTitle || hasExistingTags) {
    contextBlock = '\nExisting metadata:\n'
    if (hasExistingTitle) {
      contextBlock += `- Current title: "${existingTitle}"\n`
    }
    if (hasExistingTags) {
      contextBlock += `- Current tags: ${existingTags.join(', ')}\n`
    }
    contextBlock += '\n'
  }

  let guidelines = `Guidelines:
- Title should capture the main topic or purpose (max 60 characters)`

  if (hasExistingTitle) {
    guidelines += `\n- Consider the existing title and suggest an improved or alternative one`
  }

  if (hasExistingTags) {
    guidelines += `\n- Keep the existing tags and suggest additional relevant ones`
  }

  guidelines += `
- Tags should be single words or short phrases (lowercase, no spaces)
- Tags should represent themes, topics, or key concepts
- For very short notes (< 50 chars), use the content itself as inspiration for the title
- Keep it simple and focused
- Return 2-5 total tags`

  try {
    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `Analyze the following note content and generate a concise title and relevant tags.
${contextBlock}
Note content:
${content}

Respond with a JSON object in this exact format:
{
  "title": "A concise, descriptive title",
  "tags": ["tag1", "tag2", "tag3"]
}

${guidelines}

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
        model: 'claude-haiku-4-5-20251001',
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

    // Strip markdown code blocks if present
    let jsonText = textContent.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    // Parse the JSON response
    const generated = JSON.parse(jsonText) as GeneratedMetadata

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

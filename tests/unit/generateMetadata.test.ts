import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMetadata } from '@/services/claude/generateMetadata'

// Mock fetch globally
global.fetch = vi.fn()

describe('generateMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
    // Reset environment variable
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', 'test-api-key')
  })

  it('should return null when content is empty', async () => {
    const result = await generateMetadata({ content: '' })
    expect(result).toBeNull()
  })

  it('should return null when content is whitespace only', async () => {
    const result = await generateMetadata({ content: '   \n  ' })
    expect(result).toBeNull()
  })

  it('should return null when API key is not configured', async () => {
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', '')
    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toBeNull()
  })

  it('should use API key from localStorage when available', async () => {
    localStorage.setItem('notesAnthropicApiKey', 'local-storage-key')

    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title: 'Test Title',
            tags: ['tag1', 'tag2'],
          }),
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await generateMetadata({ content: 'This is a test note' })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://proxy-g56q77hy2a-uc.a.run.app/api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'local-storage-key',
          'anthropic-version': '2023-06-01',
        },
      })
    )
  })

  it('should prefer localStorage API key over environment variable', async () => {
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', 'env-key')
    localStorage.setItem('notesAnthropicApiKey', 'local-storage-key')

    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title: 'Test Title',
            tags: ['tag1', 'tag2'],
          }),
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await generateMetadata({ content: 'This is a test note' })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://proxy-g56q77hy2a-uc.a.run.app/api.anthropic.com/v1/messages',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'local-storage-key',
        }),
      })
    )
  })

  it('should call Claude API with correct parameters', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title: 'Test Title',
            tags: ['tag1', 'tag2'],
          }),
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    await generateMetadata({ content: 'This is a test note about programming' })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://proxy-g56q77hy2a-uc.a.run.app/api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
          'anthropic-version': '2023-06-01',
        },
      })
    )
  })

  it('should return generated metadata when API call succeeds', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title: 'Programming Notes',
            tags: ['programming', 'coding', 'development'],
          }),
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({ content: 'This is a test note about programming' })

    expect(result).toEqual({
      title: 'Programming Notes',
      tags: ['programming', 'coding', 'development'],
    })
  })

  it('should return null when API returns error status', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toBeNull()
  })

  it('should return null when API response has no text content', async () => {
    const mockResponse = {
      content: [],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toBeNull()
  })

  it('should return null when API response has invalid JSON', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: 'invalid json',
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toBeNull()
  })

  it('should return null when API response has invalid structure', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title: 'Test',
            // Missing tags array
          }),
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toBeNull()
  })

  it('should return null when fetch throws an error', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    )

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toBeNull()
  })

  it('should parse JSON wrapped in ```json code blocks', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: '```json\n{"title": "Test Title", "tags": ["tag1", "tag2"]}\n```',
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toEqual({
      title: 'Test Title',
      tags: ['tag1', 'tag2'],
    })
  })

  it('should parse JSON wrapped in ``` code blocks without language', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: '```\n{"title": "Test Title", "tags": ["tag1"]}\n```',
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toEqual({
      title: 'Test Title',
      tags: ['tag1'],
    })
  })

  it('should handle code blocks with extra whitespace', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: '  ```json\n{"title": "Whitespace Test", "tags": ["ws"]}\n```  ',
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({ content: 'Some content' })
    expect(result).toEqual({
      title: 'Whitespace Test',
      tags: ['ws'],
    })
  })

  it('should include existing title and tags in prompt context', async () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            title: 'Improved Title',
            tags: ['existing-tag', 'new-tag'],
          }),
        },
      ],
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await generateMetadata({
      content: 'Some content',
      existingTitle: 'My Title',
      existingTags: ['existing-tag'],
    })

    expect(result).toEqual({
      title: 'Improved Title',
      tags: ['existing-tag', 'new-tag'],
    })

    // Verify the prompt includes existing metadata
    const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    const prompt = callBody.messages[0].content
    expect(prompt).toContain('My Title')
    expect(prompt).toContain('existing-tag')
  })
})

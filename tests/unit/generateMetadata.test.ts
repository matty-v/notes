import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateMetadata,
  shouldGenerateTitle,
  shouldGenerateTags,
} from '@/services/claude/generateMetadata'

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
    const result = await generateMetadata('')
    expect(result).toBeNull()
  })

  it('should return null when content is whitespace only', async () => {
    const result = await generateMetadata('   \n  ')
    expect(result).toBeNull()
  })

  it('should return null when API key is not configured', async () => {
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', '')
    const result = await generateMetadata('Some content')
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

    await generateMetadata('This is a test note')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
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

    await generateMetadata('This is a test note')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
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

    await generateMetadata('This is a test note about programming')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
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

    const result = await generateMetadata('This is a test note about programming')

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

    const result = await generateMetadata('Some content')
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

    const result = await generateMetadata('Some content')
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

    const result = await generateMetadata('Some content')
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

    const result = await generateMetadata('Some content')
    expect(result).toBeNull()
  })

  it('should return null when fetch throws an error', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    )

    const result = await generateMetadata('Some content')
    expect(result).toBeNull()
  })
})

describe('shouldGenerateTitle', () => {
  it('should return true when title is undefined', () => {
    expect(shouldGenerateTitle(undefined)).toBe(true)
  })

  it('should return true when title is empty string', () => {
    expect(shouldGenerateTitle('')).toBe(true)
  })

  it('should return true when title is whitespace only', () => {
    expect(shouldGenerateTitle('   ')).toBe(true)
    expect(shouldGenerateTitle('\n\t  ')).toBe(true)
  })

  it('should return false when title has content', () => {
    expect(shouldGenerateTitle('My Title')).toBe(false)
    expect(shouldGenerateTitle('A')).toBe(false)
  })
})

describe('shouldGenerateTags', () => {
  it('should return true when tags is undefined', () => {
    expect(shouldGenerateTags(undefined)).toBe(true)
  })

  it('should return true when tags is empty string', () => {
    expect(shouldGenerateTags('')).toBe(true)
  })

  it('should return true when tags is whitespace only', () => {
    expect(shouldGenerateTags('   ')).toBe(true)
    expect(shouldGenerateTags('\n\t  ')).toBe(true)
  })

  it('should return false when tags has content', () => {
    expect(shouldGenerateTags('tag1, tag2')).toBe(false)
    expect(shouldGenerateTags('tag')).toBe(false)
  })
})

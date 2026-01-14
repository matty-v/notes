import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceRecording } from '@/hooks/use-voice-recording'

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  onresult: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onend: (() => void) | null = null

  start() {
    // Simulate successful start
  }

  stop() {
    if (this.onend) {
      this.onend()
    }
  }

  abort() {
    if (this.onend) {
      this.onend()
    }
  }

  // Helper method to simulate results
  simulateResult(transcript: string, isFinal = true) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [
          {
            0: { transcript, confidence: 0.9 },
            isFinal,
            length: 1,
            item: (index: number) => ({ transcript, confidence: 0.9 }),
          },
        ],
      }
      this.onresult(event as any)
    }
  }

  // Helper method to simulate errors
  simulateError(error: string) {
    if (this.onerror) {
      this.onerror({ error, message: error } as any)
    }
  }
}

describe('useVoiceRecording', () => {
  let mockRecognition: MockSpeechRecognition

  beforeEach(() => {
    mockRecognition = new MockSpeechRecognition()
    ;(global as any).SpeechRecognition = vi.fn(() => mockRecognition)
    ;(global.window as any).SpeechRecognition = (global as any).SpeechRecognition
  })

  it('should detect browser support', () => {
    const { result } = renderHook(() => useVoiceRecording())
    expect(result.current.isSupported).toBe(true)
  })

  it('should start listening when startListening is called', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    expect(result.current.isListening).toBe(true)
  })

  it('should stop listening when stopListening is called', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    expect(result.current.isListening).toBe(true)

    act(() => {
      result.current.stopListening()
    })

    expect(result.current.isListening).toBe(false)
  })

  it('should capture transcript when speech is recognized', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello world')
    })

    expect(result.current.transcript).toContain('Hello world')
  })

  it('should append multiple transcripts', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello')
    })

    act(() => {
      mockRecognition.simulateResult('world')
    })

    expect(result.current.transcript).toContain('Hello')
    expect(result.current.transcript).toContain('world')
  })

  it('should reset transcript when resetTranscript is called', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateResult('Hello world')
    })

    expect(result.current.transcript).toBeTruthy()

    act(() => {
      result.current.resetTranscript()
    })

    expect(result.current.transcript).toBe('')
  })

  it('should handle permission denied error', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateError('not-allowed')
    })

    expect(result.current.error).toContain('permission')
    expect(result.current.isListening).toBe(false)
  })

  it('should handle no speech error', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateError('no-speech')
    })

    expect(result.current.error).toContain('No speech detected')
    expect(result.current.isListening).toBe(false)
  })

  it('should handle network error', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateError('network')
    })

    expect(result.current.error).toContain('Network error')
    expect(result.current.isListening).toBe(false)
  })

  it('should configure language option', () => {
    renderHook(() => useVoiceRecording({ lang: 'es-ES' }))

    expect(mockRecognition.lang).toBe('es-ES')
  })

  it('should configure continuous option', () => {
    renderHook(() => useVoiceRecording({ continuous: true }))

    expect(mockRecognition.continuous).toBe(true)
  })

  it('should configure interimResults option', () => {
    renderHook(() => useVoiceRecording({ interimResults: false }))

    expect(mockRecognition.interimResults).toBe(false)
  })

  it('should not be supported when SpeechRecognition is unavailable', () => {
    delete (global.window as any).SpeechRecognition
    delete (global as any).SpeechRecognition

    const { result } = renderHook(() => useVoiceRecording())

    expect(result.current.isSupported).toBe(false)
    expect(result.current.error).toContain('not supported')
  })

  it('should handle aborted error gracefully', () => {
    const { result } = renderHook(() => useVoiceRecording())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      mockRecognition.simulateError('aborted')
    })

    // Aborted should not show an error message
    expect(result.current.error).toBeFalsy()
    expect(result.current.isListening).toBe(false)
  })
})

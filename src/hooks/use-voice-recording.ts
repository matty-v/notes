import { useState, useEffect, useCallback, useRef } from 'react'

interface VoiceRecordingOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
}

export interface VoiceRecordingState {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useVoiceRecording(options: VoiceRecordingOptions = {}): VoiceRecordingState {
  const {
    lang = 'en-US',
    continuous = false,
    interimResults = true,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognitionAPI) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognitionAPI()
    } else {
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser')
    }
  }, [])

  // Configure recognition
  useEffect(() => {
    if (!recognitionRef.current) return

    const recognition = recognitionRef.current
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = interimResults

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' '
        } else {
          interimTranscript += transcriptPiece
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)

      let errorMessage = 'An error occurred during speech recognition'

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Microphone permission denied. Please allow microphone access to use voice recording.'
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.'
          break
        case 'aborted':
          // User stopped recording, not really an error
          errorMessage = ''
          break
      }

      if (errorMessage) {
        setError(errorMessage)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognition) {
        recognition.abort()
      }
    }
  }, [lang, continuous, interimResults])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition is not available')
      return
    }

    setError(null)

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      console.error('Error starting speech recognition:', err)
      setError('Failed to start speech recognition. Please try again.')
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}

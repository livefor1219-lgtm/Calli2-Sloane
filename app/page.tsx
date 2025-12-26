'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import WhisperModal from '@/components/WhisperModal'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isWhisperOpen, setIsWhisperOpen] = useState(false)
  const [isTimeFrozen, setIsTimeFrozen] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [isThinking, setIsThinking] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Text-to-Speech function
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.volume = 1

    // Try to find a female English voice
    const voices = window.speechSynthesis.getVoices()
    const femaleVoice = voices.find(
      (voice) =>
        (voice.name.includes('Google US English') ||
          voice.name.includes('Samantha') ||
          voice.name.includes('Karen') ||
          voice.name.includes('Victoria') ||
          voice.name.includes('Female')) &&
        voice.lang.startsWith('en')
    )

    if (femaleVoice) {
      utterance.voice = femaleVoice
    }

    window.speechSynthesis.speak(utterance)
  }

  // Load voices when available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [])

  // Initialize Web Speech API for English (main mic)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Only process if whisper modal is NOT open
        if (isWhisperOpen) return

        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)
      }

      recognition.onend = () => {
        // Auto-send when recognition ends (silence detected)
        if (transcript.trim() && !isWhisperOpen) {
          handleAutoSend()
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    }
  }, [isWhisperOpen, transcript])

  const startRecording = () => {
    if (recognitionRef.current && !isWhisperOpen) {
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.start()
      setIsRecording(true)
      setTranscript('')
    }
  }

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }

    // Auto-send transcript
    if (transcript.trim()) {
      await handleAutoSend()
    }
  }

  const handleAutoSend = async () => {
    const userText = transcript.trim()
    if (!userText) return

    // Add user message to history
    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setTranscript('')
    setIsThinking(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, level: currentLevel }),
      })

      const data = await response.json()
      if (data.response) {
        // Add assistant message to history
        setMessages((prev) => [...prev, { role: 'assistant', text: data.response }])
        
        // Speak the response
        speak(data.response)
      }
    } catch (error) {
      console.error('Error sending to Sloane:', error)
      const errorMessage = "I'm having technical difficulties. Try again."
      setMessages((prev) => [...prev, { role: 'assistant', text: errorMessage }])
      speak(errorMessage)
    } finally {
      setIsThinking(false)
    }
  }

  const handleWhisperTranslate = async (korean: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: korean, isWhisper: true, level: currentLevel }),
      })

      const data = await response.json()
      return data.response || 'Translation failed'
    } catch (error) {
      console.error('Translation error:', error)
      return 'Translation failed. Try again.'
    }
  }

  const handleWhisperOpen = () => {
    // Stop English recording if active
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
    setIsTimeFrozen(true)
    setIsWhisperOpen(true)
  }

  const handleWhisperClose = () => {
    setIsWhisperOpen(false)
    setTimeout(() => setIsTimeFrozen(false), 300)
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden transition-all duration-500"
      style={{
        filter: isTimeFrozen ? 'grayscale(100%) blur(10px)' : 'none',
      }}
    >
      {/* Animated Background Blob */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-orange/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className={`container mx-auto px-4 py-8 relative z-10 ${isTimeFrozen ? 'pointer-events-none' : ''}`}>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/60">Level {currentLevel} / 4</span>
            <span className="text-sm text-white/60">Practice Mode</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-orange transition-all duration-500"
              style={{ width: `${(currentLevel / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Microphone Button */}
          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isWhisperOpen}
              className={`relative w-32 h-32 rounded-full ${
                isRecording
                  ? 'bg-neon-orange animate-pulse-slow'
                  : 'bg-neon-orange/80 hover:bg-neon-orange'
              } transition-all duration-300 shadow-2xl shadow-neon-orange/50 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <MicOff size={48} className="text-white" />
              ) : (
                <Mic size={48} className="text-white" />
              )}
              <div className="absolute inset-0 rounded-full bg-neon-orange/20 animate-ping" />
            </button>
          </div>

          {/* Current Transcript (while recording) */}
          {transcript && isRecording && (
            <div className="flex justify-end">
              <div className="bg-white/10 px-4 py-2 rounded-lg max-w-md">
                <p className="text-white/60 text-sm">Recording...</p>
                <p className="text-white/80 text-lg leading-relaxed">{transcript}</p>
              </div>
            </div>
          )}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="glass-strong p-4 border-2 border-neon-orange/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                  <span className="text-neon-orange font-bold text-sm">SLOANE</span>
                  <span className="text-white/60 text-sm ml-2">is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Chat History */}
          <div className="space-y-4 min-h-[400px]">
            {messages.length === 0 && !transcript && !isThinking && (
              <div className="glass p-12 text-center">
                <p className="text-white/40 text-lg">
                  Click the microphone to start your pitch
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'user' ? (
                  // User Message - Right Aligned, Grey
                  <div className="max-w-md">
                    <p className="text-white/60 text-sm mb-1 text-right">You</p>
                    <div className="bg-white/5 px-4 py-3 rounded-lg">
                      <p className="text-white/80 text-base leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                ) : (
                  // Sloane Message - Left Aligned, Glassmorphism with Neon Orange Border
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                      <span className="text-neon-orange font-bold text-sm">SLOANE</span>
                    </div>
                    <div className="glass-strong p-4 border-2 border-neon-orange/50 shadow-lg shadow-neon-orange/20">
                      <p className="text-white text-base leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Whisper Button */}
        <button
          onClick={handleWhisperOpen}
          disabled={isRecording}
          className="fixed bottom-8 right-8 glass px-6 py-3 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">🤫</span>
          <span className="text-white font-semibold">Whisper</span>
        </button>
      </div>

      {/* Whisper Modal */}
      <WhisperModal
        isOpen={isWhisperOpen}
        onClose={handleWhisperClose}
        onTranslate={handleWhisperTranslate}
        recognitionRef={recognitionRef}
      />
    </div>
  )
}

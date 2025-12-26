'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface WhisperModalProps {
  isOpen: boolean
  onClose: () => void
  onTranslate: (korean: string) => Promise<string>
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>
}

export default function WhisperModal({ isOpen, onClose, onTranslate, recognitionRef }: WhisperModalProps) {
  const [koreanTranscript, setKoreanTranscript] = useState('')
  const [englishHint, setEnglishHint] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isRecordingKorean, setIsRecordingKorean] = useState(false)
  const whisperRecognitionRef = useRef<SpeechRecognition | null>(null)

  // Initialize Korean Speech Recognition when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ko-KR' // Korean for whisper mode

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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

        setKoreanTranscript(finalTranscript || interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error('Korean speech recognition error:', event.error)
      }

      whisperRecognitionRef.current = recognition
    }

    return () => {
      // Cleanup: stop recognition when modal closes
      if (whisperRecognitionRef.current) {
        try {
          whisperRecognitionRef.current.stop()
        } catch (e) {
          // Ignore errors if already stopped
        }
      }
    }
  }, [isOpen])

  const startKoreanRecording = () => {
    if (whisperRecognitionRef.current) {
      whisperRecognitionRef.current.lang = 'ko-KR' // Ensure Korean
      whisperRecognitionRef.current.start()
      setIsRecordingKorean(true)
      setKoreanTranscript('')
      setEnglishHint('')
    }
  }

  const stopKoreanRecording = () => {
    if (whisperRecognitionRef.current) {
      whisperRecognitionRef.current.stop()
      setIsRecordingKorean(false)
    }
  }

  const handleTranslate = async () => {
    if (!koreanTranscript.trim()) return

    setIsTranslating(true)
    try {
      const translated = await onTranslate(koreanTranscript.trim())
      setEnglishHint(translated)
    } catch (error) {
      console.error('Translation error:', error)
      setEnglishHint('Translation failed. Try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleClose = () => {
    // Stop Korean recording if active
    if (whisperRecognitionRef.current && isRecordingKorean) {
      whisperRecognitionRef.current.stop()
      setIsRecordingKorean(false)
    }
    
    // Reset to English for main recognition
    if (recognitionRef.current) {
      recognitionRef.current.lang = 'en-US'
    }

    setKoreanTranscript('')
    setEnglishHint('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-black/90 w-full max-w-2xl p-6 space-y-4 rounded-2xl border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neon-orange">
            속마음을 말하세요
          </h2>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Korean Speech Transcript Display */}
          <div className="space-y-2">
            <label className="text-white/80 text-sm font-medium">
              한국어 음성 인식 (실시간)
            </label>
            <div className="bg-white/10 border border-white/20 rounded-lg p-4 min-h-[200px]">
              {koreanTranscript ? (
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {koreanTranscript}
                </p>
              ) : (
                <p className="text-white/40 text-base">
                  {isRecordingKorean 
                    ? '말씀해주세요...' 
                    : '한국어로 말하고 싶은 것을 녹음하거나 직접 입력하세요'}
                </p>
              )}
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex gap-3">
            <button
              onClick={isRecordingKorean ? stopKoreanRecording : startKoreanRecording}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                isRecordingKorean
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-neon-orange hover:bg-neon-orange/90 text-white'
              }`}
            >
              {isRecordingKorean ? '⏹️ 녹음 중지' : '🎤 한국어 녹음 시작'}
            </button>

            <button
              onClick={handleTranslate}
              disabled={!koreanTranscript.trim() || isTranslating}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/40 rounded-lg font-semibold transition-colors text-white"
            >
              {isTranslating ? '번역 중...' : '번역하기'}
            </button>
          </div>

          {/* English Translation Hint */}
          {englishHint && (
            <div className="p-4 bg-neon-orange/20 border-2 border-neon-orange/50 rounded-lg">
              <p className="text-sm text-neon-orange/80 mb-2 font-semibold">영어로 이렇게 말하세요:</p>
              <p className="text-white text-lg font-medium leading-relaxed">{englishHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

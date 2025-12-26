'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface WhisperModalProps {
  isOpen: boolean
  onClose: () => void
  onTranslate: (korean: string) => Promise<string>
}

export default function WhisperModal({ isOpen, onClose, onTranslate }: WhisperModalProps) {
  const [koreanInput, setKoreanInput] = useState('')
  const [englishHint, setEnglishHint] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)

  if (!isOpen) return null

  const handleTranslate = async () => {
    if (!koreanInput.trim()) return

    setIsTranslating(true)
    try {
      const translated = await onTranslate(koreanInput)
      setEnglishHint(translated)
    } catch (error) {
      console.error('Translation error:', error)
      setEnglishHint('Translation failed. Try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleClose = () => {
    setKoreanInput('')
    setEnglishHint('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="glass-strong w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
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

        <div className="space-y-3">
          <textarea
            value={koreanInput}
            onChange={(e) => setKoreanInput(e.target.value)}
            placeholder="한국어로 말하고 싶은 것을 입력하세요..."
            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-neon-orange/50 resize-none"
          />

          <button
            onClick={handleTranslate}
            disabled={!koreanInput.trim() || isTranslating}
            className="w-full py-3 bg-neon-orange hover:bg-neon-orange/90 disabled:bg-white/10 disabled:text-white/40 rounded-lg font-semibold transition-colors"
          >
            {isTranslating ? '번역 중...' : '번역하기'}
          </button>

          {englishHint && (
            <div className="p-4 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
              <p className="text-sm text-white/60 mb-2">영어로 이렇게 말하세요:</p>
              <p className="text-white font-medium">{englishHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


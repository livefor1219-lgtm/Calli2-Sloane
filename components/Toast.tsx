'use client'

import { useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'error' | 'success' | 'info'
  onClose: () => void
  onRetry?: () => void
  duration?: number
}

export default function Toast({ 
  message, 
  type = 'error', 
  onClose, 
  onRetry,
  duration = 4000 
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[10000] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-black/90 backdrop-blur-md border-2 border-orange-500/60 rounded-lg px-4 py-3 shadow-[0_0_30px_rgba(249,115,22,0.6)] min-w-[300px] max-w-[500px]">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm font-medium flex-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-400 text-xs font-semibold rounded transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            >
              Retry
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}


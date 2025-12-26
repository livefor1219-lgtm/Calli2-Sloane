"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Toast from '@/components/Toast';

// --- 설정 ---
// .env.local에 NEXT_PUBLIC_GEMINI_API_KEY가 있어야 합니다.
// 런타임에 환경 변수 가져오기
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 window 객체를 통해 접근
    return (window as any).__NEXT_PUBLIC_GEMINI_API_KEY__ || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
};

// API 키를 직접 설정 (개발용)
const API_KEY = "AIzaSyAV85Fv56MDnAgFZMhg2Bzcf3u2t7lo53s";
const GEN_AI = new GoogleGenerativeAI(API_KEY);

interface ToastState {
  message: string;
  type?: 'error' | 'success' | 'info';
  onRetry?: () => void;
}

export default function Home() {
  // 상태 관리
  const [level, setLevel] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isWhisperOpen, setIsWhisperOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [whisperInput, setWhisperInput] = useState("");
  const [whisperResult, setWhisperResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lastError, setLastError] = useState<{ text: string; retryFn: () => void } | null>(null);

  // 음성 인식 (Web Speech API)
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);

  // 침묵 감지 타이머 리셋
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // 침묵 감지 타이머 시작
  const startSilenceTimer = () => {
    resetSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // 1.5초 동안 침묵이면 자동 전송
      if (isRecording && transcriptRef.current.trim()) {
        const transcript = transcriptRef.current.trim();
        if (isWhisperOpen) {
          setWhisperInput(transcript);
          handleWhisperSubmit(transcript);
        } else {
          handleSendMessage(transcript);
        }
        setCurrentTranscript('');
        transcriptRef.current = '';
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsRecording(false);
      }
    }, 1500);
  };

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // continuous로 변경하여 계속 듣기
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setCurrentTranscript(fullTranscript);
        transcriptRef.current = fullTranscript;

        // 음성이 감지되면 타이머 리셋
        if (fullTranscript.trim()) {
          lastSpeechTimeRef.current = Date.now();
          resetSilenceTimer();
          
          // 최종 결과가 있으면 즉시 전송 (finalTranscript)
          if (finalTranscript.trim()) {
            if (isWhisperOpen) {
              setWhisperInput(finalTranscript.trim());
              handleWhisperSubmit(finalTranscript.trim());
            } else {
              handleSendMessage(finalTranscript.trim());
            }
            setCurrentTranscript('');
            transcriptRef.current = '';
            resetSilenceTimer();
          } else {
            // interim 결과면 침묵 타이머 시작
            startSilenceTimer();
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        resetSilenceTimer();
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setCurrentTranscript('');
        resetSilenceTimer();
        
        // Toast Notification으로 에러 표시
        let errorMessage = "음성 인식 오류가 발생했습니다.";
        if (event.error === 'no-speech') {
          errorMessage = "음성이 감지되지 않았습니다. 다시 시도해주세요.";
        } else if (event.error === 'network') {
          errorMessage = "네트워크 오류가 발생했습니다.";
        } else if (event.error === 'not-allowed') {
          errorMessage = "마이크 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.";
        } else if (event.error === 'aborted') {
          errorMessage = "음성 인식이 중단되었습니다.";
        }

        const retryFn = () => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setIsRecording(true);
            } catch (e) {
              showToast("다시 시도할 수 없습니다. 페이지를 새로고침해주세요.");
            }
          }
        };

        showToast(errorMessage, 'error', retryFn);
      };
    }

    return () => {
      resetSilenceTimer();
    };
  }, [isWhisperOpen]);

  // Toast 표시 함수
  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error', onRetry?: () => void) => {
    setToast({ message, type, onRetry });
  };

  // TTS (텍스트 읽어주기)
  const speak = (text: string) => {
    if (typeof window !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.2; // Sloane은 말이 빠름
      // 목소리 선택 (가능하다면)
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
      if (femaleVoice) utterance.voice = femaleVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 녹음 시작
  const startRecording = (forWhisper = false) => {
    if (!recognitionRef.current) {
      showToast("이 브라우저는 음성 인식을 지원하지 않습니다.", 'error');
      return;
    }
    
    try {
      recognitionRef.current.lang = forWhisper ? 'ko-KR' : 'en-US';
      recognitionRef.current.start();
      setIsRecording(true);
      lastSpeechTimeRef.current = Date.now();
    } catch (error: any) {
      showToast("음성 인식을 시작할 수 없습니다. 마이크 권한을 확인해주세요.", 'error', () => {
        startRecording(forWhisper);
      });
    }
  };

  // 메시지 전송 (Gemini)
  const handleSendMessage = async (text: string, retryCount = 0) => {
    if (!text.trim()) return;

    // 1. 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setLoading(true);
    setLastError(null);

    try {
      // API 키 확인
      const apiKey = API_KEY || getApiKey();
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }

      const model = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        System: You are Sloane, a brutal Silicon Valley Venture Partner. 
        Current Level: ${level}/4.
        User said: "${text}"
        Task: Reply in 1-2 sentences. Be critical, cynical, and fast. NO small talk.
      `;
      
      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]) as any;

      const response = result.response.text();

      // 2. 슬론 메시지 추가
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      
      // 3. 말하기
      speak(response);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // 오류 처리 개선
      let errorMessage = "I'm having technical difficulties. Try again.";
      
      if (error.message === 'API_KEY_MISSING') {
        errorMessage = "API key is missing. Please check your .env.local file.";
      } else if (error.message === 'TIMEOUT') {
        errorMessage = "Request timed out. The network might be slow.";
      } else if (error.message?.includes('API key')) {
        errorMessage = "Invalid API key. Check your configuration.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Check your internet connection.";
      }

      const retryFn = () => {
        if (retryCount < 3) {
          handleSendMessage(text, retryCount + 1);
        } else {
          showToast("재시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.", 'error');
        }
      };

      setLastError({ text: errorMessage, retryFn });
      showToast(errorMessage, 'error', retryFn);
      
      // 에러 메시지를 채팅에도 추가 (하지만 앱은 계속 작동)
      setMessages(prev => [...prev, { role: 'assistant', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  // 속삭임 처리 (Gemini)
  const handleWhisperSubmit = async (koreanText: string, retryCount = 0) => {
    if (!koreanText.trim()) return;

    setLoading(true);
    try {
      // API 키 확인
      const apiKey = API_KEY || getApiKey();
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }

      const model = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        System: Translate this Korean complaint/thought into Sophisticated Silicon Valley Business English.
        Input: "${koreanText}"
        Output: Just the English phrase. Nothing else.
      `;
      
      // 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]) as any;

      const response = result.response.text();
      setWhisperResult(response);
    } catch (error: any) {
      console.error('Whisper translation error:', error);
      
      // 오류 처리
      let errorMessage = "Translation failed. Try again.";
      
      if (error.message === 'API_KEY_MISSING') {
        errorMessage = "API key is missing.";
      } else if (error.message === 'TIMEOUT') {
        errorMessage = "Translation timed out.";
      } else if (error.message?.includes('network')) {
        errorMessage = "Network error.";
      }

      const retryFn = () => {
        if (retryCount < 3) {
          handleWhisperSubmit(koreanText, retryCount + 1);
        } else {
          showToast("재시도 횟수를 초과했습니다.", 'error');
        }
      };

      showToast(errorMessage, 'error', retryFn);
      setWhisperResult(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative font-sans">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onRetry={toast.onRetry}
          onClose={() => setToast(null)}
        />
      )}

      {/* 배경 장식 */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
      
      {/* 상단 레벨바 */}
      <div className="p-6 relative z-10">
        <div className="flex justify-between mb-2 text-sm text-gray-400">
          <span>Level {level} / 4</span>
          <span>Practice Mode</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full">
          <div 
            className="h-full bg-[#ff5722] rounded-full transition-all duration-500"
            style={{ width: `${level * 25}%` }}
          />
        </div>
      </div>

      {/* 메인 대화 영역 (스크롤) */}
      <div className="h-[60vh] overflow-y-auto px-6 space-y-4 relative z-10 pb-20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-gray-800/50 text-right border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                : 'bg-white/10 backdrop-blur-md border border-orange-500/50 text-left shadow-[0_0_25px_rgba(249,115,22,0.5)]'
            }`}>
              {msg.role === 'assistant' && <div className="text-[#ff5722] text-xs font-bold mb-1">Sloane</div>}
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* 현재 녹음 중인 텍스트 표시 */}
        {currentTranscript && isRecording && !isWhisperOpen && (
          <div className="flex justify-end">
            <div className="max-w-[80%] p-4 rounded-2xl bg-gray-800/30 text-right border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
              <p className="text-gray-400 text-xs mb-1">Recording...</p>
              <p className="text-white/70 text-sm italic">{currentTranscript}</p>
            </div>
          </div>
        )}

        {/* "Sloane is thinking..." - Three-dot typing animation */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-md border border-orange-500/50 p-4 rounded-2xl shadow-[0_0_25px_rgba(249,115,22,0.5)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff5722] rounded-full animate-pulse" />
                <span className="text-[#ff5722] text-xs font-bold">SLOANE</span>
                <span className="text-gray-400 text-sm ml-2 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Retry 버튼 (에러 발생 시) */}
        {lastError && !loading && (
          <div className="flex justify-start">
            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/50 p-4 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <p className="text-red-400 text-sm mb-2">{lastError.text}</p>
              <button
                onClick={lastError.retryFn}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-400 text-xs font-semibold rounded transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)]"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 마이크 버튼 */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={() => isRecording ? (recognitionRef.current?.stop(), setIsRecording(false), resetSilenceTimer()) : startRecording(false)}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all border-2 border-orange-500/60 shadow-[0_0_40px_rgba(249,115,22,0.6)] active:scale-95 ${
            isRecording ? 'bg-red-600 scale-110 hover:scale-110' : 'bg-[#ff5722] hover:scale-105'
          }`}
        >
          {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>

      {/* Whisper 버튼 (우측 하단) */}
      <button 
        onClick={() => setIsWhisperOpen(true)}
        className="fixed bottom-10 right-6 z-20 flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-full border-2 border-orange-500/50 hover:bg-gray-700 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
      >
        <span className="text-xl">🤫</span>
        <span className="text-sm font-bold">Whisper</span>
      </button>

      {/* === WHISPER MODAL (Time Freeze) === */}
      {isWhisperOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center">
          {/* 배경 블러 처리 */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsWhisperOpen(false)} />
          
          <div className="relative z-50 w-full max-w-md px-6 text-center">
            <h2 className="text-[#ff5722] text-xl font-bold mb-6 tracking-widest animate-pulse">
              TIME FROZEN
            </h2>
            
            <p className="text-gray-400 mb-4">Tell me in Korean...</p>
            
            <div className="text-3xl font-bold text-white mb-8 min-h-[60px]">
              {whisperInput || "터치해서 말하세요..."}
            </div>

            {whisperResult && (
              <div className="bg-white/10 p-6 rounded-xl border-2 border-orange-500/50 mb-8 shadow-[0_0_25px_rgba(249,115,22,0.5)]">
                <p className="text-gray-400 text-sm mb-2">Sloane's Suggestion:</p>
                <p className="text-2xl font-bold text-[#ff5722]">{whisperResult}</p>
              </div>
            )}

            <button 
              onClick={() => startRecording(true)}
              className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto hover:bg-white/30 active:scale-95 border-2 border-orange-500/50 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              <Mic className="w-6 h-6 text-white" />
            </button>

            <button 
              onClick={() => setIsWhisperOpen(false)}
              className="mt-8 text-gray-500 underline text-sm hover:text-white active:scale-95 transition-all"
            >
              Close / Resume Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

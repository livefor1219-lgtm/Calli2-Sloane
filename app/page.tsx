"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare, Volume2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 설정 ---
// .env.local에 NEXT_PUBLIC_GEMINI_API_KEY가 있어야 합니다.
const GEN_AI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export default function Home() {
  // 상태 관리
  const [level, setLevel] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isWhisperOpen, setIsWhisperOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [whisperInput, setWhisperInput] = useState("");
  const [whisperResult, setWhisperResult] = useState("");
  const [loading, setLoading] = useState(false);

  // 음성 인식 (Web Speech API)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (isWhisperOpen) {
          // 속삭임 모드면 텍스트 입력창에 넣기
          setWhisperInput(transcript);
          handleWhisperSubmit(transcript);
        } else {
          // 일반 대화면 바로 전송
          handleSendMessage(transcript);
        }
      };
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [isWhisperOpen]);

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
    if (!recognitionRef.current) return alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
    
    recognitionRef.current.lang = forWhisper ? 'ko-KR' : 'en-US';
    recognitionRef.current.start();
    setIsRecording(true);
  };

  // 메시지 전송 (Gemini)
  const handleSendMessage = async (text: string) => {
    // 1. 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const model = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        System: You are Sloane, a brutal Silicon Valley Venture Partner. 
        Current Level: ${level}/4.
        User said: "${text}"
        Task: Reply in 1-2 sentences. Be critical, cynical, and fast. NO small talk.
      `;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // 2. 슬론 메시지 추가
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      
      // 3. 말하기
      speak(response);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: "Error: API connection failed. Check your key." }]);
    } finally {
      setLoading(false);
    }
  };

  // 속삭임 처리 (Gemini)
  const handleWhisperSubmit = async (koreanText: string) => {
    setLoading(true);
    try {
      const model = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        System: Translate this Korean complaint/thought into Sophisticated Silicon Valley Business English.
        Input: "${koreanText}"
        Output: Just the English phrase. Nothing else.
      `;
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      setWhisperResult(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative font-sans">
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
                ? 'bg-gray-800/50 text-right' 
                : 'bg-white/10 backdrop-blur-md border border-white/20 text-left shadow-[0_0_15px_rgba(255,87,34,0.3)]'
            }`}>
              {msg.role === 'assistant' && <div className="text-[#ff5722] text-xs font-bold mb-1">Sloane</div>}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-center text-gray-500 animate-pulse">Sloane is thinking...</div>}
      </div>

      {/* 하단 마이크 버튼 */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={() => startRecording(false)}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_#ff5722] ${
            isRecording ? 'bg-red-600 scale-110' : 'bg-[#ff5722] hover:scale-105'
          }`}
        >
          {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>

      {/* Whisper 버튼 (우측 하단) */}
      <button 
        onClick={() => setIsWhisperOpen(true)}
        className="fixed bottom-10 right-6 z-20 flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-full border border-gray-600 hover:bg-gray-700 transition-all"
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
              <div className="bg-white/10 p-6 rounded-xl border border-[#ff5722] mb-8">
                <p className="text-gray-400 text-sm mb-2">Sloane's Suggestion:</p>
                <p className="text-2xl font-bold text-[#ff5722]">{whisperResult}</p>
              </div>
            )}

            <button 
              onClick={() => startRecording(true)}
              className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto hover:bg-white/30 border border-white/50"
            >
              <Mic className="w-6 h-6 text-white" />
            </button>

            <button 
              onClick={() => setIsWhisperOpen(false)}
              className="mt-8 text-gray-500 underline text-sm"
            >
              Close / Resume Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

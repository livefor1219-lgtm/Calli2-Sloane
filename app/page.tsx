"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function Home() {
  const [level, setLevel] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isWhisperOpen, setIsWhisperOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [whisperInput, setWhisperInput] = useState("");
  const [whisperResult, setWhisperResult] = useState("");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);

        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');

        if (isWhisperOpen) {
           setWhisperInput(transcript);
           silenceTimer.current = setTimeout(() => {
             if (transcript.trim()) {
               handleWhisperSubmit(transcript);
               stopRecording();
             }
           }, 2000); 
        } else {
           silenceTimer.current = setTimeout(() => {
             if (transcript.trim().length > 0) {
                stopRecording();
                handleSendMessage(transcript);
             }
           }, 1500);
        }
      };
    }
  }, [isWhisperOpen]);

  const speak = (text: string) => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.1; 
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
      if (targetVoice) utterance.voice = targetVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = (forWhisper = false) => {
    if (!recognitionRef.current) return alert("크롬 브라우저를 사용해주세요.");
    recognitionRef.current.lang = forWhisper ? 'ko-KR' : 'en-US';
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  };

  // 서버 API를 통한 메시지 전송 (안전한 연결)
  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, level })
      });

      const data = await response.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
        speak(data.response);
      } else {
        throw new Error(data.details || 'Unknown error');
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: "연결 에러가 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  };

  // 서버 API를 통한 번역 요청
  const handleWhisperSubmit = async (koreanText: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: koreanText, isWhisper: true })
      });

      const data = await response.json();
      if (data.response) {
        setWhisperResult(data.response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
      
      {/* Level Bar */}
      <div className="p-6 relative z-10">
        <div className="flex justify-between mb-2 text-sm text-gray-400">
          <span>Level {level} / 4</span>
          <span>Sloane (AI Partner)</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full">
          <div className="h-full bg-[#ff5722] rounded-full transition-all duration-500" style={{ width: `${level * 25}%` }} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="h-[60vh] overflow-y-auto px-6 space-y-4 relative z-10 pb-20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl border ${
              msg.role === 'user' 
                ? 'bg-gray-800/50 text-right border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                : 'bg-white/10 backdrop-blur-md border-orange-500/50 text-left shadow-[0_0_20px_rgba(249,115,22,0.4)]'
            }`}>
              {msg.role === 'assistant' && <div className="text-[#ff5722] text-xs font-bold mb-1">Sloane</div>}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex items-center gap-2 p-4 animate-pulse">
             <div className="w-2 h-2 bg-[#ff5722] rounded-full animate-bounce" />
             <div className="w-2 h-2 bg-[#ff5722] rounded-full animate-bounce delay-75" />
             <div className="w-2 h-2 bg-[#ff5722] rounded-full animate-bounce delay-150" />
           </div>
        )}
      </div>

      {/* Mic Button */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={() => isRecording ? stopRecording() : startRecording(false)}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_#ff5722] border-2 border-orange-500/60 active:scale-95 ${
            isRecording ? 'bg-red-600 scale-110' : 'bg-[#ff5722] hover:scale-105'
          }`}
        >
          {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>

      {/* Whisper Button */}
      <button 
        onClick={() => setIsWhisperOpen(true)}
        className="fixed bottom-10 right-6 z-20 flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-full border-2 border-orange-500/50 hover:bg-gray-700 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
      >
        <span className="text-xl">🤫</span>
        <span className="text-sm font-bold">Whisper</span>
      </button>

      {/* Whisper Modal */}
      {isWhisperOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsWhisperOpen(false)} />
          
          <div className="relative z-50 w-full max-w-md px-6 text-center">
            <h2 className="text-[#ff5722] text-xl font-bold mb-6 tracking-widest animate-pulse">
              TIME FROZEN
            </h2>
            <p className="text-gray-400 mb-4">속마음을 말하세요 (Korean)</p>
            
            <div className="text-3xl font-bold text-white mb-8 min-h-[60px] break-keep">
              {whisperInput || "..."}
            </div>

            {whisperResult && (
              <div className="bg-white/10 p-6 rounded-xl border-2 border-orange-500/50 mb-8 shadow-[0_0_25px_rgba(249,115,22,0.5)]">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Sloane's Translation</p>
                <p className="text-2xl font-bold text-[#ff5722]">{whisperResult}</p>
              </div>
            )}

            <button 
              onClick={() => startRecording(true)}
              className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto hover:bg-white/30 border-2 border-orange-500/50 active:scale-95 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              <Mic className="w-6 h-6 text-white" />
            </button>

            <button 
              onClick={() => setIsWhisperOpen(false)}
              className="mt-8 text-gray-500 underline text-sm hover:text-white active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

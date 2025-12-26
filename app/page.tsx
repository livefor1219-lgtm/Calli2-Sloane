"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 설정 ---
const GEN_AI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAV85Fv56MDnAgFZMhg2Bzcf3u2t7lo53s");

export default function Home() {
  const [level, setLevel] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isWhisperOpen, setIsWhisperOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [whisperInput, setWhisperInput] = useState("");
  const [whisperResult, setWhisperResult] = useState("");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<any>(null); // 침묵 감지용 타이머

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // 끊기지 않게 설정
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        // 말하는 중에는 타이머 리셋
        if (silenceTimer.current) clearTimeout(silenceTimer.current);

        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');

        // 속삭임 모드일 때
        if (isWhisperOpen) {
           setWhisperInput(transcript);
           // 속삭임은 침묵 감지 후 자동 번역
           silenceTimer.current = setTimeout(() => {
             handleWhisperSubmit(transcript);
             stopRecording();
           }, 2000); 
        } 
        // 일반 대화 모드일 때 (침묵 1.5초 감지)
        else {
           // 화면에 임시로 보여주는 로직이 필요하다면 추가 가능하지만, 
           // 여기서는 심플하게 침묵 후 전송으로 갑니다.
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
      window.speechSynthesis.cancel(); // 기존 음성 취소
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
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  };

  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      // ★★★ 모델명 수정됨: gemini-pro ★★★
      const model = GEN_AI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        System: You are Sloane, a brutal Silicon Valley Venture Partner. 
        Current Level: ${level}/4.
        User said: "${text}"
        Task: Reply in 1-2 sentences. Be critical, cynical, and fast. NO small talk.
      `;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      speak(response);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: "API Error. Check console." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleWhisperSubmit = async (koreanText: string) => {
    setLoading(true);
    try {
      // ★★★ 모델명 수정됨: gemini-pro ★★★
      const model = GEN_AI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        System: Translate this Korean text into Sophisticated Silicon Valley Business English.
        Input: "${koreanText}"
        Output: Just the English phrase.
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
        {loading && (
           <div className="flex items-center gap-2 text-[#ff5722] animate-pulse">
             <div className="w-2 h-2 bg-[#ff5722] rounded-full animate-bounce" />
             <div className="w-2 h-2 bg-[#ff5722] rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
             <div className="w-2 h-2 bg-[#ff5722] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
           </div>
        )}
      </div>

      {/* Mic Button */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-20">
        <button 
          onClick={() => isRecording ? stopRecording() : startRecording(false)}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_#ff5722] border-2 border-orange-500/60 active:scale-95 ${
            isRecording ? 'bg-red-600 scale-110 animate-pulse' : 'bg-[#ff5722] hover:scale-105'
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

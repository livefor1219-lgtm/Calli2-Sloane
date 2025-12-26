import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const BASE_SYSTEM_PROMPT = `You are Sloane, a brutal Silicon Valley Venture Partner. You are cold, fast, and cynical. You hate small talk. You critique the user's pitch. Keep answers short (max 2 sentences).
Your philosophy: "I don't invest in ideas; I invest in people who can communicate."`

export async function POST(request: NextRequest) {
  try {
    const { message, isWhisper, level } = await request.json()

    // 서버 사이드에서만 안전하게 키를 관리합니다.
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAV85Fv56MDnAgFZMhg2Bzcf3u2t7lo53s"
    
    if (!apiKey || apiKey === "your_actual_api_key_here") {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // 최신 모델 이름 사용 (v1 API에서 지원)
    // gemini-1.5-pro-latest 또는 gemini-1.5-flash-latest 사용
    let model
    try {
      // 먼저 최신 모델 시도
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
    } catch (e1: any) {
      try {
        // 대안 1: gemini-1.5-pro-latest
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' })
      } catch (e2: any) {
        try {
          // 대안 2: gemini-1.5-flash (접미사 없이)
          model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        } catch (e3: any) {
          // 마지막 대안: gemini-1.5-pro
          model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
        }
      }
    }

    let prompt = ''
    if (isWhisper) {
      prompt = `Translate this Korean startup founder's thought into Sophisticated Silicon Valley Business English. 
      Input: "${message}"
      Output: Just the English phrase. Nothing else.`
    } else {
      prompt = `${BASE_SYSTEM_PROMPT} 
      Current Level: ${level || 1}/4.
      User says: "${message}"
      Sloane:`
    }

    // AI 응답 생성
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text) throw new Error('AI가 빈 응답을 반환했습니다.')

    return NextResponse.json({ response: text.trim() })
  } catch (error: any) {
    console.error('SERVER_API_ERROR:', error)
    // 클라이언트에 실제 에러 원인을 전달 (디버깅용)
    return NextResponse.json(
      { 
        error: 'AI 응답 생성 실패', 
        details: error.message,
        suggestion: 'API 키 활성화 여부나 할당량을 확인하세요.'
      }, 
      { status: 500 }
    )
  }
}

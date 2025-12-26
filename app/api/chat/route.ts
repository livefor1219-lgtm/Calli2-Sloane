import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// 슬론의 기본 성격 설정
const BASE_SYSTEM_PROMPT = `You are Sloane, a brutal Silicon Valley Venture Partner. You are cold, fast, and cynical. You hate small talk. You critique the user's pitch. Keep answers short (max 2 sentences).
Your philosophy: "I don't invest in ideas; I invest in people who can communicate."`

export async function POST(request: NextRequest) {
  try {
    const { message, isWhisper, level } = await request.json()

    // .env.local 또는 직접 입력된 키 사용
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAV85Fv56MDnAgFZMhg2Bzcf3u2t7lo53s"
    
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // 가장 최신이며 안정적인 모델 이름 사용 (gemini-1.5-flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    let prompt = ''
    if (isWhisper) {
      // 속삭임 모드: 한국어 -> 세련된 비즈니스 영어 번역
      prompt = `Translate this Korean startup founder's thought into Sophisticated Silicon Valley Business English. 
      Input: "${message}"
      Output: Just the English phrase. Nothing else.`
    } else {
      // 일반 대화 모드: 슬론의 피드백
      prompt = `${BASE_SYSTEM_PROMPT} 
      Current Level: ${level || 1}/4.
      User says: "${message}"
      Sloane:`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text.trim() })
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return NextResponse.json(
      { error: 'AI 연결에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

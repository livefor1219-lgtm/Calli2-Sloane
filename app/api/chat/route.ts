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

    // REST API를 직접 호출 (CORS 문제 완전 해결)
    // 실제로 사용 가능한 모델: gemini-2.5-flash (가장 빠름) 또는 gemini-2.5-pro
    const modelName = 'gemini-2.5-flash' // 빠르고 무료 할당량이 많음
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
    
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

    // REST API 직접 호출
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // 응답 파싱
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!text) {
      throw new Error('AI가 빈 응답을 반환했습니다.')
    }

    return NextResponse.json({ response: text.trim() })
  } catch (error: any) {
    console.error('SERVER_API_ERROR:', error)
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

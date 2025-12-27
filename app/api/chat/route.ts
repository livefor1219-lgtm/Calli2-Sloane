import { NextRequest, NextResponse } from 'next/server'

const BASE_SYSTEM_PROMPT = `You are Sloane, a brutal Silicon Valley Venture Partner. You are cold, fast, and cynical. You hate small talk. You critique the user's pitch. Keep answers short (max 2 sentences).
Your philosophy: "I don't invest in ideas; I invest in people who can communicate."`

export async function POST(request: NextRequest) {
  try {
    const { message, isWhisper, level } = await request.json()

    // 서버 사이드에서만 안전하게 키를 관리합니다.
    // ⚠️ 하드코딩된 API 키 제거 - 환경 변수만 사용
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    
    // 디버깅: 환경 변수 확인 (서버 콘솔에만 출력)
    console.log('🔍 Environment Check:', {
      hasGEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      hasNEXT_PUBLIC_GEMINI_API_KEY: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      apiKeyLength: apiKey?.length || 0
    })
    
    if (!apiKey) {
      console.error('❌ API Key not found in environment variables')
      return NextResponse.json({ 
        error: 'API 키가 설정되지 않았습니다.', 
        details: '.env.local 파일에 GEMINI_API_KEY 또는 NEXT_PUBLIC_GEMINI_API_KEY를 설정해주세요. 개발 서버를 재시작했는지 확인하세요.'
      }, { status: 500 })
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
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      
      // 할당량 초과 에러 특별 처리
      if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
        // 재시도 시간 추출 (예: "Please retry in 47.739259522s")
        const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i)
        const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60
        
        return NextResponse.json({
          error: 'API 할당량 초과',
          details: `무료 티어는 시간당 20회 요청 제한이 있습니다.`,
          retryAfter: retrySeconds,
          retryMessage: `${retrySeconds}초 후에 다시 시도해주세요.`,
          suggestion: '잠시 기다렸다가 다시 시도하거나, Google AI Studio에서 할당량을 확인하세요.'
        }, { status: 429 }) // 429 Too Many Requests
      }
      
      throw new Error(errorMessage)
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

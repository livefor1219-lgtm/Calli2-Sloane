import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const BASE_SYSTEM_PROMPT = `You are Sloane, a brutal Silicon Valley Venture Partner. You are cold, fast, and cynical. You hate small talk. You critique the user's pitch. Keep answers short (max 2 sentences).

Your philosophy: "I don't invest in ideas; I invest in people who can communicate."`

const LEVEL_PROMPTS: Record<number, string> = {
  1: "Goal: Ice breaking. Don't talk business yet. Keep it casual but interesting. Avoid weather talk.",
  2: "Goal: Storytelling. Ask about their background. Help them frame their underdog story as ambition, not pity.",
  3: "Goal: The Pitch. Ask about money/BM. Demand specific numbers, margins, unit economics. Be brutal about vague answers.",
  4: "Goal: Gossip. Talk slang/insider info. Use terms like 'burn rate', 'ghosted', 'down round'. Keep it off the record.",
}

export async function POST(request: NextRequest) {
  try {
    const { message, isWhisper, level } = await request.json()

    // Use server-side env var (without NEXT_PUBLIC_)
    // 개발용: 직접 API 키 설정
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAV85Fv56MDnAgFZMhg2Bzcf3u2t7lo53s"
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // 가장 안정적인 모델 사용 (gemini-pro는 가장 오래되고 안정적)
    // v1beta API에서도 작동하는 모델
    let model
    try {
      // 먼저 gemini-pro 시도 (가장 안정적)
      model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    } catch (e: any) {
      // gemini-pro가 실패하면 다른 모델 시도
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
      } catch (e2: any) {
        // 마지막으로 gemini-1.5-flash 시도
        try {
          model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        } catch (e3: any) {
          throw new Error(`No available model found. Tried: gemini-pro, gemini-1.5-pro, gemini-1.5-flash. Last error: ${e3?.message || e2?.message || e?.message}`)
        }
      }
    }

    // Get level-specific prompt
    const currentLevel = level || 1
    const levelPrompt = LEVEL_PROMPTS[currentLevel] || LEVEL_PROMPTS[1]

    let prompt = ''
    if (isWhisper) {
      // For whisper mode, focus on translation
      prompt = `${BASE_SYSTEM_PROMPT}\n\nUser's Korean input: ${message}\n\nTranslate this to sophisticated Silicon Valley business English. Make it sound natural and confident, not literal.`
    } else {
      // Regular conversation with level context
      prompt = `${BASE_SYSTEM_PROMPT}\n\n${levelPrompt}\n\nUser: ${message}\n\nSloane:`
    }

    // 실제 API 호출 시도
    let result
    try {
      result = await model.generateContent(prompt)
    } catch (modelError: any) {
      // 모델 호출 실패 시 다른 모델로 재시도
      console.error('Model call failed, trying alternative:', modelError.message)
      
      // gemini-pro로 재시도
      if (model) {
        try {
          const altModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
          result = await altModel.generateContent(prompt)
        } catch (altError: any) {
          throw new Error(`All models failed. Last error: ${altError?.message || modelError?.message}`)
        }
      } else {
        throw modelError
      }
    }
    
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text.trim() })
  } catch (error: any) {
    console.error('Gemini API error:', error)
    
    // 더 자세한 에러 메시지 반환
    let errorMessage = 'Failed to get response from AI'
    if (error.message) {
      errorMessage = error.message
    } else if (error.error?.message) {
      errorMessage = error.error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

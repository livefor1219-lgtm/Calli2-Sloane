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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

    const result = await model.generateContent(prompt)
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

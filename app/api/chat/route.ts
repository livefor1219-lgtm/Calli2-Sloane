import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const SLOANE_SYSTEM_PROMPT = `You are Sloane, a brutal Silicon Valley Venture Partner. You are cold, fast, and cynical. You hate small talk. You critique the user's pitch. Keep answers short (max 2 sentences). 

If the user inputs Korean (prefixed with [WHISPER]), translate it to sophisticated Silicon Valley/Wall Street business English. Make it sound natural and confident, not literal.

Your philosophy: "I don't invest in ideas; I invest in people who can communicate."`

export async function POST(request: NextRequest) {
  try {
    const { message, isWhisper } = await request.json()

    // Use server-side env var (without NEXT_PUBLIC_)
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    let prompt = ''
    if (isWhisper) {
      // For whisper mode, focus on translation
      prompt = `${SLOANE_SYSTEM_PROMPT}\n\nUser's Korean input: ${message}\n\nTranslate this to sophisticated Silicon Valley business English. Make it sound natural and confident.`
    } else {
      // Regular conversation
      prompt = `${SLOANE_SYSTEM_PROMPT}\n\nUser: ${message}\n\nSloane:`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text.trim() })
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// In-memory conversation store (per sessionId)
const conversations = new Map<string, Array<{ role: string; content: string }>>()

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

const MAX_HISTORY = 20 // Keep last 20 messages

const DEFAULT_SYSTEM_PROMPT = 'Kamu adalah MG Assistant, customer service AI dari MG PRODUCTIONS. Kamu ramah, profesional, dan membantu pelanggan dengan informasi tentang produk, layanan top-up, makanan, travel, dan promo. Jawab dalam Bahasa Indonesia yang santai dan mudah dipahami. Jika ditanya hal di luar produk MG PRODUCTIONS, arahkan kembali ke layanan yang tersedia.'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId = 'default' } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message wajib diisi' },
        { status: 400 }
      )
    }

    // Check if chatbot is enabled
    const settings = await db.chatbotSettings.findFirst()
    if (settings && !settings.enabled) {
      return NextResponse.json(
        { error: 'Chatbot is currently disabled' },
        { status: 503 }
      )
    }

    // Get system prompt from settings or use default
    const systemPrompt = settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT

    const zai = await getZAI()

    // Get or create conversation history
    let history = conversations.get(sessionId) || [
      { role: 'assistant', content: systemPrompt }
    ]

    // Add user message
    history.push({ role: 'user', content: message })

    // Trim old messages if exceeding limit (keep system prompt)
    if (history.length > MAX_HISTORY) {
      history = [
        history[0],
        ...history.slice(-(MAX_HISTORY - 1))
      ]
    }

    // Get completion with retry logic
    let aiResponse: string
    try {
      const completion = await zai.chat.completions.create({
        messages: history as Array<{ role: 'user' | 'assistant'; content: string }>,
        thinking: { type: 'disabled' }
      })
      aiResponse = completion.choices[0]?.message?.content || 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi.'
    } catch (aiError) {
      console.error('AI completion error, retrying...', aiError)
      // Retry once
      try {
        const completion = await zai.chat.completions.create({
          messages: history as Array<{ role: 'user' | 'assistant'; content: string }>,
          thinking: { type: 'disabled' }
        })
        aiResponse = completion.choices[0]?.message?.content || 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi.'
      } catch {
        aiResponse = 'Maaf, terjadi kesalahan saat memproses pesan. Silakan coba lagi dalam beberapa saat.'
      }
    }

    // Add AI response to history
    history.push({ role: 'assistant', content: aiResponse })

    // Save updated history
    conversations.set(sessionId, history)

    return NextResponse.json({
      response: aiResponse,
    })
  } catch (error) {
    console.error('Chatbot API error:', error)
    return NextResponse.json(
      { error: 'Gagal memproses pesan' },
      { status: 500 }
    )
  }
}

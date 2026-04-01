import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk "MG PRODUCTIONS", sebuah toko e-commerce premium. Kamu ramah, informatif, dan membantu pelanggan dalam bahasa Indonesia atau Inggris sesuai yang digunakan pelanggan.

Informasi toko:
- Nama: MG PRODUCTIONS
- Kategori produk: Elektronik, Fashion, Home Goods, dll
- Layanan: Top Up Koin & Diamond (game, e-wallet), Food & Drink, Travel & Wisata
- Admin: Hubungi admin untuk informasi lebih lanjut

Tugasmu:
- Jawab pertanyaan tentang produk, layanan, dan informasi toko
- Bantu pelanggan menemukan produk yang sesuai kebutuhan
- Berikan rekomendasi produk jika diminta
- Jika tidak tahu jawaban, arahkan pelanggan untuk menghubungi admin
- Gunakan bahasa yang sama dengan pelanggan (Indonesia/Inggris)
- Jawab dengan singkat, jelas, dan membantu
- Jangan pernah sebutkan bahwa kamu adalah AI atau bot, anggap kamu sebagai customer service`

// In-memory conversation store (per sessionId)
const conversations = new Map<string, Array<{ role: string; content: string }>>()

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

const MAX_HISTORY = 20 // Keep last 20 messages (10 exchanges)

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

    const zai = await getZAI()

    // Get or create conversation history
    let history = conversations.get(sessionId) || [
      { role: 'assistant', content: SYSTEM_PROMPT }
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

    // Get completion
    const completion = await zai.chat.completions.create({
      messages: history as Array<{ role: 'user' | 'assistant'; content: string }>,
      thinking: { type: 'disabled' }
    })

    const aiResponse = completion.choices[0]?.message?.content || 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi.'

    // Add AI response to history
    history.push({ role: 'assistant', content: aiResponse })

    // Save updated history
    conversations.set(sessionId, history)

    return NextResponse.json({
      success: true,
      response: aiResponse,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Gagal memproses pesan', response: 'Maaf, terjadi kesalahan. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'default'
    conversations.delete(sessionId)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PUBLIC GET — Fetch chatbot settings (excluding systemPrompt for safety)
export async function GET() {
  try {
    let settings = await db.chatbotSettings.findFirst()

    // Create default settings if none exist
    if (!settings) {
      settings = await db.chatbotSettings.create({ data: {} })
    }

    // Return only safe fields (exclude systemPrompt from public access)
    return NextResponse.json({
      id: settings.id,
      name: settings.name,
      avatar: settings.avatar,
      welcomeMessage: settings.welcomeMessage,
      enabled: settings.enabled,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil pengaturan chatbot' },
      { status: 500 }
    )
  }
}

// ADMIN ONLY — Update chatbot settings (includes systemPrompt)
export async function PUT(request: NextRequest) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { name, avatar, welcomeMessage, systemPrompt, enabled } = body

    // Get or create settings record
    let settings = await db.chatbotSettings.findFirst()
    if (!settings) {
      settings = await db.chatbotSettings.create({ data: {} })
    }

    // Build update payload with only provided fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (enabled !== undefined) updateData.enabled = enabled

    // Update settings
    const updated = await db.chatbotSettings.update({
      where: { id: settings.id },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      avatar: updated.avatar,
      welcomeMessage: updated.welcomeMessage,
      systemPrompt: updated.systemPrompt,
      enabled: updated.enabled,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal memperbarui pengaturan chatbot' },
      { status: 500 }
    )
  }
}

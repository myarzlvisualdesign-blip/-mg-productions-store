import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import {
  getCanonicalChatbotSettings,
  toPublicChatbotSettings,
} from '@/lib/chatbot-settings'

// PUBLIC GET — Fetch chatbot settings (excluding systemPrompt for safety)
export async function GET(request: NextRequest) {
  try {
    const settings = await getCanonicalChatbotSettings()
    const { authorized } = requireAdmin(request)

    return publicJson(
      toPublicChatbotSettings(settings, {
        includeSystemPrompt: authorized,
      })
    )
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

    const settings = await getCanonicalChatbotSettings()

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

    return NextResponse.json(
      toPublicChatbotSettings(updated, {
        includeSystemPrompt: true,
      })
    )
  } catch {
    return NextResponse.json(
      { error: 'Gagal memperbarui pengaturan chatbot' },
      { status: 500 }
    )
  }
}

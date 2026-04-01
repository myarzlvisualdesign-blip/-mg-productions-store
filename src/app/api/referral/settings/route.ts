import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PUBLIC GET — Fetch referral settings (create defaults if not exist)
export async function GET() {
  try {
    let settings = await db.referralSettings.findFirst()

    // Create default settings if none exist
    if (!settings) {
      settings = await db.referralSettings.create({ data: {} })
    }

    return NextResponse.json({
      id: settings.id,
      enabled: settings.enabled,
      referrerReward: settings.referrerReward,
      refereeReward: settings.refereeReward,
      minOrderAmount: settings.minOrderAmount,
      minWithdraw: settings.minWithdraw,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil pengaturan referral' },
      { status: 500 }
    )
  }
}

// ADMIN ONLY — Update referral settings
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
    const { enabled, referrerReward, refereeReward, minOrderAmount, minWithdraw } = body

    // Get or create settings record
    let settings = await db.referralSettings.findFirst()
    if (!settings) {
      settings = await db.referralSettings.create({ data: {} })
    }

    // Build update payload with only provided fields
    const updateData: Record<string, unknown> = {}
    if (enabled !== undefined) updateData.enabled = enabled
    if (referrerReward !== undefined) updateData.referrerReward = referrerReward
    if (refereeReward !== undefined) updateData.refereeReward = refereeReward
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount
    if (minWithdraw !== undefined) updateData.minWithdraw = minWithdraw

    // Update settings
    const updated = await db.referralSettings.update({
      where: { id: settings.id },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      enabled: updated.enabled,
      referrerReward: updated.referrerReward,
      refereeReward: updated.refereeReward,
      minOrderAmount: updated.minOrderAmount,
      minWithdraw: updated.minWithdraw,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal memperbarui pengaturan referral' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import {
  getCanonicalReferralSettings,
  toPublicReferralSettings,
} from '@/lib/referral-settings'

export const dynamic = 'force-dynamic'

// PUBLIC GET — Fetch referral settings (create defaults if not exist)
export async function GET() {
  try {
    const settings = await getCanonicalReferralSettings()
    return publicJson(toPublicReferralSettings(settings))
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

    const settings = await getCanonicalReferralSettings()

    // Build update payload with only provided fields
    const updateData: Record<string, unknown> = {}
    if (enabled !== undefined) updateData.enabled = enabled
    if (referrerReward !== undefined) updateData.referrerReward = referrerReward
    if (refereeReward !== undefined) updateData.refereeReward = refereeReward
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount
    if (minWithdraw !== undefined) updateData.minWithdraw = minWithdraw

    const updated = await db.referralSettings.update({
      where: { id: settings.id },
      data: updateData,
    })

    return publicJson(toPublicReferralSettings(updated))
  } catch {
    return NextResponse.json(
      { error: 'Gagal memperbarui pengaturan referral' },
      { status: 500 }
    )
  }
}

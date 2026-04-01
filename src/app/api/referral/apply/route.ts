import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUBLIC POST — Apply a referral code to an order (called after checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, orderType, orderId, customerName, customerEmail, orderTotal } = body

    // Validate required fields
    if (!code || !orderType || !orderId || !customerName || !customerEmail || orderTotal === undefined) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    // Validate orderType — referral only applies to "store" and "travel"
    if (orderType !== 'store' && orderType !== 'travel') {
      return NextResponse.json(
        { error: 'Referral tidak berlaku untuk layanan ini' },
        { status: 400 }
      )
    }

    // Get referral settings (create defaults if not exist)
    let settings = await db.referralSettings.findFirst()
    if (!settings) {
      settings = await db.referralSettings.create({ data: {} })
    }

    // Check if referral program is enabled
    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Program referral sedang tidak aktif' },
        { status: 503 }
      )
    }

    // Find the referral code
    const referralCode = await db.referralCode.findUnique({
      where: { code },
    })

    if (!referralCode || !referralCode.active) {
      return NextResponse.json(
        { error: 'Kode referral tidak valid' },
        { status: 404 }
      )
    }

    // Check customer is not the code owner (can't refer yourself)
    if (customerEmail.trim().toLowerCase() === referralCode.ownerEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Tidak dapat menggunakan kode referral sendiri' },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (orderTotal < settings.minOrderAmount) {
      return NextResponse.json(
        { error: `Total pesanan minimum Rp ${settings.minOrderAmount.toLocaleString('id-ID')} untuk menggunakan referral` },
        { status: 400 }
      )
    }

    // Check if this orderId was already used (prevent duplicate)
    const existingUse = await db.referralUse.findFirst({
      where: { orderId },
    })

    if (existingUse) {
      return NextResponse.json(
        { error: 'Pesanan ini sudah menggunakan kode referral' },
        { status: 400 }
      )
    }

    // Determine rewards
    const referrerReward = settings.referrerReward
    const refereeReward = settings.refereeReward

    // Create the referral use record
    await db.referralUse.create({
      data: {
        referralCodeId: referralCode.id,
        orderType,
        orderId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        referrerReward,
        refereeReward,
      },
    })

    // Update referral code: increment totalUsed and add referrerReward to totalReward
    await db.referralCode.update({
      where: { id: referralCode.id },
      data: {
        totalUsed: { increment: 1 },
        totalReward: { increment: referrerReward },
      },
    })

    return NextResponse.json({
      success: true,
      refereeReward,
      referrerReward,
      message: `Referral berhasil! Anda mendapat potongan Rp ${refereeReward.toLocaleString('id-ID')}`,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menerapkan kode referral' },
      { status: 500 }
    )
  }
}

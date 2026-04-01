import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 6
const CODE_PREFIX = 'MG-'

// Generate a unique 8-character referral code (MG-XXXXXX)
function generateCode(): string {
  let code = CODE_PREFIX
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

// Simple email format validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// PUBLIC POST — Create a new referral code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ownerName, ownerEmail } = body

    // Validate required fields
    if (!ownerName || typeof ownerName !== 'string' || ownerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nama wajib diisi' },
        { status: 400 }
      )
    }

    if (!ownerEmail || typeof ownerEmail !== 'string' || !isValidEmail(ownerEmail.trim())) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    const trimmedEmail = ownerEmail.trim().toLowerCase()

    // Check if an active referral code already exists for this email
    const existing = await db.referralCode.findFirst({
      where: {
        ownerEmail: trimmedEmail,
        active: true,
      },
    })

    if (existing) {
      const balance = existing.totalReward - existing.totalWithdrawn
      return NextResponse.json({
        id: existing.id,
        code: existing.code,
        ownerName: existing.ownerName,
        ownerEmail: existing.ownerEmail,
        totalUsed: existing.totalUsed,
        totalReward: existing.totalReward,
        totalWithdrawn: existing.totalWithdrawn,
        balance,
        active: existing.active,
      })
    }

    // Generate unique code with collision retry
    let code = generateCode()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const existingCode = await db.referralCode.findUnique({
        where: { code },
      })
      if (!existingCode) break
      code = generateCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Gagal membuat kode referral. Silakan coba lagi.' },
        { status: 500 }
      )
    }

    // Create the referral code
    const referralCode = await db.referralCode.create({
      data: {
        code,
        ownerName: ownerName.trim(),
        ownerEmail: trimmedEmail,
      },
    })

    return NextResponse.json({
      id: referralCode.id,
      code: referralCode.code,
      ownerName: referralCode.ownerName,
      ownerEmail: referralCode.ownerEmail,
      totalUsed: referralCode.totalUsed,
      totalReward: referralCode.totalReward,
      totalWithdrawn: referralCode.totalWithdrawn,
      balance: referralCode.totalReward - (referralCode.totalWithdrawn || 0),
      active: referralCode.active,
    }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal membuat kode referral' },
      { status: 500 }
    )
  }
}

// PUBLIC GET — Look up a referral code by query param ?code=MG-XXXXXX
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Parameter kode referral diperlukan' },
        { status: 400 }
      )
    }

    const referralCode = await db.referralCode.findUnique({
      where: { code },
    })

    if (!referralCode || !referralCode.active) {
      return NextResponse.json(
        { error: 'Kode referral tidak valid' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: referralCode.id,
      code: referralCode.code,
      ownerName: referralCode.ownerName,
      ownerEmail: referralCode.ownerEmail,
      totalUsed: referralCode.totalUsed,
      totalReward: referralCode.totalReward,
      totalWithdrawn: referralCode.totalWithdrawn,
      balance: referralCode.totalReward - (referralCode.totalWithdrawn || 0),
      active: referralCode.active,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal mencari kode referral' },
      { status: 500 }
    )
  }
}

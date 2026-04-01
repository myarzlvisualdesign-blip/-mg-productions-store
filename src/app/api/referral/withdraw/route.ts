import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUBLIC GET — List withdrawal history + balance for a referral code
// Query: ?code=MG-XXXXXX or ?referralCodeId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const code = searchParams.get('code')
    const referralCodeId = searchParams.get('referralCodeId')

    if (!code && !referralCodeId) {
      return NextResponse.json({ error: 'Kode referral diperlukan' }, { status: 400 })
    }

    // Find referral code by code or id
    const referralCode = referralCodeId
      ? await db.referralCode.findUnique({ where: { id: referralCodeId } })
      : await db.referralCode.findUnique({ where: { code: code! } })

    if (!referralCode) {
      return NextResponse.json({ error: 'Kode referral tidak valid' }, { status: 404 })
    }

    const availableBalance = referralCode.totalReward - referralCode.totalWithdrawn

    // Get withdrawal history
    const withdrawals = await db.referralWithdrawal.findMany({
      where: { referralCodeId: referralCode.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      totalReward: referralCode.totalReward,
      totalWithdrawn: referralCode.totalWithdrawn,
      availableBalance,
      withdrawals,
    })
  } catch {
    return NextResponse.json({ error: 'Gagal memuat riwayat pencairan' }, { status: 500 })
  }
}

// PUBLIC POST — Request a withdrawal
// Body: { code?, referralCodeId?, amount, bankName, bankAccount, accountHolder }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, referralCodeId, amount, bankName, bankAccount, accountHolder } = body

    if (!amount || !bankName || !bankAccount || !accountHolder) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const withdrawAmount = parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah pencairan tidak valid' }, { status: 400 })
    }

    // Get settings for min withdrawal
    let settings = await db.referralSettings.findFirst()
    if (!settings) settings = await db.referralSettings.create({ data: {} })

    if (!settings.enabled) {
      return NextResponse.json({ error: 'Program referral sedang tidak aktif' }, { status: 503 })
    }

    // Check minimum withdrawal
    if (withdrawAmount < settings.minWithdraw) {
      return NextResponse.json(
        { error: `Minimum pencairan Rp ${Math.round(settings.minWithdraw).toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    // Find the referral code by code or id
    const referralCode = referralCodeId
      ? await db.referralCode.findUnique({ where: { id: referralCodeId } })
      : await db.referralCode.findUnique({ where: { code } })

    if (!referralCode || !referralCode.active) {
      return NextResponse.json({ error: 'Kode referral tidak valid' }, { status: 404 })
    }

    // Check available balance
    const availableBalance = referralCode.totalReward - referralCode.totalWithdrawn
    if (withdrawAmount > availableBalance) {
      return NextResponse.json(
        { error: `Saldo tidak cukup. Saldo tersedia: Rp ${Math.round(availableBalance).toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    // Only one pending withdrawal at a time
    const pendingWithdrawal = await db.referralWithdrawal.findFirst({
      where: { referralCodeId: referralCode.id, status: 'pending' },
    })
    if (pendingWithdrawal) {
      return NextResponse.json(
        { error: 'Anda sudah memiliki permintaan pencairan yang sedang diproses. Tunggu hingga selesai.' },
        { status: 400 }
      )
    }

    // Sanitize bank fields
    const cleanBankName = bankName.trim()
    const cleanBankAccount = bankAccount.trim().replace(/[^0-9-]/g, '')
    const cleanAccountHolder = accountHolder.trim()

    if (cleanBankAccount.length < 8) {
      return NextResponse.json({ error: 'Nomor rekening tidak valid (min 8 digit)' }, { status: 400 })
    }

    // Create withdrawal
    const withdrawal = await db.referralWithdrawal.create({
      data: {
        referralCodeId: referralCode.id,
        amount: withdrawAmount,
        bankName: cleanBankName,
        bankAccount: cleanBankAccount,
        accountHolder: cleanAccountHolder,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        bankName: withdrawal.bankName,
        bankAccount: withdrawal.bankAccount,
        accountHolder: withdrawal.accountHolder,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
      message: `Permintaan pencairan Rp ${Math.round(withdrawAmount).toLocaleString('id-ID')} berhasil diajukan`,
    })
  } catch {
    return NextResponse.json({ error: 'Gagal mengajukan pencairan' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'paid']
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// ADMIN GET — List all withdrawals with pagination and optional status filter
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const auth = requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query params
    const statusParam = request.nextUrl.searchParams.get('status') ?? 'all'
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || DEFAULT_PAGE)
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || DEFAULT_LIMIT))

    // Build where clause
    const where: Record<string, unknown> = {}
    if (statusParam !== 'all' && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam
    }

    // Get total count and withdrawals in parallel
    const [total, withdrawals] = await Promise.all([
      db.referralWithdrawal.count({ where }),
      db.referralWithdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          referralCode: {
            select: {
              code: true,
              ownerName: true,
              ownerEmail: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      withdrawals,
      total,
      page,
      limit,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil data penarikan' },
      { status: 500 }
    )
  }
}

// ADMIN PUT — Update withdrawal status with balance tracking
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authorization
    const auth = requireAdmin(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, status, adminNote } = body

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID dan status wajib diisi' },
        { status: 400 }
      )
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid. Gunakan: pending, approved, rejected, atau paid' },
        { status: 400 }
      )
    }

    // Find the withdrawal record
    const withdrawal = await db.referralWithdrawal.findUnique({
      where: { id },
    })

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Permintaan penarikan tidak ditemukan' },
        { status: 404 }
      )
    }

    const previousStatus = withdrawal.status

    // If status changes TO "approved" or "paid": increment totalWithdrawn
    if (
      (status === 'approved' || status === 'paid') &&
      previousStatus !== 'approved' &&
      previousStatus !== 'paid'
    ) {
      await db.referralCode.update({
        where: { id: withdrawal.referralCodeId },
        data: {
          totalWithdrawn: { increment: withdrawal.amount },
        },
      })
    }

    // If status changes FROM "approved" or "paid" TO something else: decrement totalWithdrawn
    if (
      (previousStatus === 'approved' || previousStatus === 'paid') &&
      status !== 'approved' &&
      status !== 'paid'
    ) {
      await db.referralCode.update({
        where: { id: withdrawal.referralCodeId },
        data: {
          totalWithdrawn: { decrement: withdrawal.amount },
        },
      })

      // Edge case: ensure totalWithdrawn never goes negative
      const referralCode = await db.referralCode.findUnique({
        where: { id: withdrawal.referralCodeId },
        select: { totalWithdrawn: true },
      })

      if (referralCode && referralCode.totalWithdrawn < 0) {
        await db.referralCode.update({
          where: { id: withdrawal.referralCodeId },
          data: { totalWithdrawn: 0 },
        })
      }
    }

    // Update the withdrawal record
    const updated = await db.referralWithdrawal.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote !== undefined ? String(adminNote).trim() : withdrawal.adminNote,
      },
      include: {
        referralCode: {
          select: {
            code: true,
            ownerName: true,
            ownerEmail: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengupdate status penarikan' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PUBLIC — Customer bisa membuat order baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, total, customerName, customerEmail, customerPhone, address } = body

    if (!items || total === undefined || total === null || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Data order belum lengkap' },
        { status: 400 }
      )
    }

    const order = await db.order.create({
      data: {
        items: JSON.stringify(items),
        total: parseFloat(total),
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        address: address || null,
        status: 'pending',
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal membuat order' },
      { status: 500 }
    )
  }
}

// ADMIN ONLY — Lihat semua order
export async function GET(request: NextRequest) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

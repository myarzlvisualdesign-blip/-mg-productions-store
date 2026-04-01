import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// ADMIN ONLY — Update status order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Whitelist allowed fields to prevent mass assignment
    const { status, customerName, customerEmail, customerPhone, address } = body
    const order = await db.order.update({
      where: { id },
      data: { status, customerName, customerEmail, customerPhone, address },
    })

    return NextResponse.json(order)
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengupdate order' },
      { status: 500 }
    )
  }
}

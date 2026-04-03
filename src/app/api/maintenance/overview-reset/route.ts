import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const [products, orders] = await Promise.all([
      db.product.findMany({ orderBy: { createdAt: 'asc' } }),
      db.order.findMany({ orderBy: { createdAt: 'asc' } }),
    ])

    await db.$transaction([
      db.order.deleteMany({}),
      db.product.deleteMany({}),
    ])

    return NextResponse.json({
      success: true,
      backup: {
        exportedAt: new Date().toISOString(),
        products,
        orders,
      },
      deleted: {
        products: products.length,
        orders: orders.length,
      },
    })
  } catch (error) {
    console.error('Failed to reset overview data:', error)
    return NextResponse.json(
      { error: 'Gagal mereset data overview' },
      { status: 500 }
    )
  }
}

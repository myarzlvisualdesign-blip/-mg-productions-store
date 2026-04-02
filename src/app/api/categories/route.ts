import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'

// GET /api/categories — list active categories (storefront & product form)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const categories = await db.category.findMany({
      where: showAll ? {} : { active: true },
      orderBy: { order: 'asc' },
    })
    return publicJson(categories)
  } catch {
    return publicJson(
      { error: 'Gagal mengambil data kategori' },
      { status: 500 }
    )
  }
}

// POST /api/categories — create new category (admin)
export async function POST(request: NextRequest) {
  try {
    const { authorized } = requireAdmin(request)
    if (!authorized) {
      return NextResponse.json(
        { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { name, order, active } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama kategori wajib diisi' },
        { status: 400 }
      )
    }

    // Check uniqueness
    const existing = await db.category.findFirst({
      where: { name: name.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' },
        { status: 409 }
      )
    }

    let catOrder = order ?? 0
    if (!order && order !== 0) {
      const maxOrder = await db.category.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      catOrder = (maxOrder?.order ?? -1) + 1
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        order: catOrder,
        active: active ?? true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambahkan kategori' },
      { status: 500 }
    )
  }
}

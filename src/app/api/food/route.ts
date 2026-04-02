import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import { normalizeAssetUrl } from '@/lib/asset-url'

// GET /api/food — list food items (active only by default, ?all=true for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const foodItems = await db.foodItem.findMany({
      where: showAll ? {} : { active: true },
    })
    return publicJson(foodItems.sort((a, b) => a.order - b.order).map((item) => ({
      ...item,
      image: normalizeAssetUrl(item.image),
    })))
  } catch {
    return publicJson(
      { error: 'Gagal mengambil data menu makanan' },
      { status: 500 }
    )
  }
}

// POST /api/food — create a new food item (admin)
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
    const { name, subtitle, emoji, color, image, items, link, order, active } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama menu makanan wajib diisi' },
        { status: 400 }
      )
    }

    // Get the next order value if not provided
    let itemOrder = order ?? 0
    if (!order && order !== 0) {
      const items = await db.foodItem.findMany({ select: { order: true } })
      itemOrder = items.reduce((max, item) => Math.max(max, item.order), -1) + 1
    }

    const foodItem = await db.foodItem.create({
      data: {
        name: name.trim(),
        subtitle: (subtitle || '').trim(),
        emoji: (emoji || '🍜').trim(),
        color: (color || 'from-orange-600 to-orange-400').trim(),
        items: items ?? '[]',
        image: (image || '').trim(),
        link: (link || '').trim(),
        order: itemOrder,
        active: active ?? true,
      },
    })

    return NextResponse.json(foodItem, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambahkan menu makanan' },
      { status: 500 }
    )
  }
}

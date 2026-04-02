import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import { normalizeAssetUrl } from '@/lib/asset-url'

// GET /api/destinations — list popular destinations (active only by default, ?all=true for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const destinations = await db.popularDestination.findMany({
      where: showAll ? {} : { active: true },
      orderBy: { order: 'asc' },
    })
    return publicJson(destinations.map((destination) => ({
      ...destination,
      image: normalizeAssetUrl(destination.image),
    })))
  } catch {
    return publicJson(
      { error: 'Gagal mengambil data destinasi' },
      { status: 500 }
    )
  }
}

// POST /api/destinations — create a new popular destination (admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const { name, subtitle, emoji, color, image, order, active } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama destinasi wajib diisi' },
        { status: 400 }
      )
    }

    // Get the next order value if not provided
    let destOrder = order ?? 0
    if (!order && order !== 0) {
      const maxOrder = await db.popularDestination.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      destOrder = (maxOrder?.order ?? -1) + 1
    }

    const destination = await db.popularDestination.create({
      data: {
        name: name.trim(),
        subtitle: (subtitle || '').trim(),
        emoji: (emoji || '📍').trim(),
        color: (color || 'from-purple-600 to-blue-400').trim(),
        image: (image || '').trim(),
        order: destOrder,
        active: active ?? true,
      },
    })

    return NextResponse.json(destination, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambahkan destinasi' },
      { status: 500 }
    )
  }
}

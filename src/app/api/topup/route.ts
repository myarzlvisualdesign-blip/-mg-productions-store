import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import { normalizeAssetUrl } from '@/lib/asset-url'

// GET /api/topup — list topup services (active only by default, ?all=true for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const topupServices = await db.topUpService.findMany({
      where: showAll ? {} : { active: true },
    })
    return publicJson(topupServices.sort((a, b) => a.order - b.order).map((service) => ({
      ...service,
      image: normalizeAssetUrl(service.image),
    })))
  } catch {
    return publicJson(
      { error: 'Gagal mengambil data layanan top-up' },
      { status: 500 }
    )
  }
}

// POST /api/topup — create a new topup service (admin)
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
        { error: 'Nama layanan top-up wajib diisi' },
        { status: 400 }
      )
    }

    // Get the next order value if not provided
    let serviceOrder = order ?? 0
    if (!order && order !== 0) {
      const services = await db.topUpService.findMany({ select: { order: true } })
      serviceOrder = services.reduce((max, item) => Math.max(max, item.order), -1) + 1
    }

    const topUpService = await db.topUpService.create({
      data: {
        name: name.trim(),
        subtitle: (subtitle || '').trim(),
        emoji: (emoji || '🎮').trim(),
        color: (color || 'from-purple-600 to-purple-400').trim(),
        items: items ?? '[]',
        image: (image || '').trim(),
        link: (link || '').trim(),
        order: serviceOrder,
        active: active ?? true,
      },
    })

    return NextResponse.json(topUpService, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambahkan layanan top-up' },
      { status: 500 }
    )
  }
}

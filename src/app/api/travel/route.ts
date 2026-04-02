import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import { normalizeAssetUrl } from '@/lib/asset-url'

// GET /api/travel — list travel services (active only by default, ?all=true for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const travelServices = await db.travelService.findMany({
      where: showAll ? {} : { active: true },
    })
    return publicJson(travelServices.sort((a, b) => a.order - b.order).map((service) => ({
      ...service,
      image: normalizeAssetUrl(service.image),
    })))
  } catch {
    return publicJson(
      { error: 'Gagal mengambil data layanan travel' },
      { status: 500 }
    )
  }
}

// POST /api/travel — create a new travel service (admin)
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
    const { name, subtitle, emoji, color, desc, image, link, order, active } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama layanan travel wajib diisi' },
        { status: 400 }
      )
    }

    // Get the next order value if not provided
    let serviceOrder = order ?? 0
    if (!order && order !== 0) {
      const services = await db.travelService.findMany({ select: { order: true } })
      serviceOrder = services.reduce((max, item) => Math.max(max, item.order), -1) + 1
    }

    const travelService = await db.travelService.create({
      data: {
        name: name.trim(),
        subtitle: (subtitle || '').trim(),
        emoji: (emoji || '✈️').trim(),
        color: (color || 'from-sky-600 to-blue-400').trim(),
        desc: (desc || '').trim(),
        image: (image || '').trim(),
        link: (link || '').trim(),
        order: serviceOrder,
        active: active ?? true,
      },
    })

    return NextResponse.json(travelService, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambahkan layanan travel' },
      { status: 500 }
    )
  }
}

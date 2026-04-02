import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import { normalizeAssetUrl } from '@/lib/asset-url'

// GET /api/partners — list partners (active only by default, ?all=true for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const partners = await db.partner.findMany({
      where: showAll ? {} : { active: true },
    })
    return publicJson(partners.sort((a, b) => a.order - b.order).map((partner) => ({
      ...partner,
      image: normalizeAssetUrl(partner.image),
    })))
  } catch {
    return publicJson(
      { error: 'Gagal mengambil data mitra' },
      { status: 500 }
    )
  }
}

// POST /api/partners — create a new partner (admin)
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
    const { name, description, image, link, order, active } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama mitra wajib diisi' },
        { status: 400 }
      )
    }

    if (!image || !image.trim()) {
      return NextResponse.json(
        { error: 'Gambar mitra wajib diisi' },
        { status: 400 }
      )
    }

    // Get the next order value if not provided
    let partnerOrder = order ?? 0
    if (!order && order !== 0) {
      const partners = await db.partner.findMany({ select: { order: true } })
      partnerOrder = partners.reduce((max, item) => Math.max(max, item.order), -1) + 1
    }

    const partner = await db.partner.create({
      data: {
        name: name.trim(),
        description: (description || '').trim(),
        image: image.trim(),
        link: (link || '').trim(),
        order: partnerOrder,
        active: active ?? true,
      },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambahkan mitra' },
      { status: 500 }
    )
  }
}

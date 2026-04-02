import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import { normalizeAssetUrl } from '@/lib/asset-url'

// GET /api/topup-banners — list banners (active only by default, ?all=true for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const banners = await db.topUpBanner.findMany({
      where: showAll ? {} : { active: true },
    })
    return publicJson(banners.sort((a, b) => a.order - b.order).map((banner) => ({
      ...banner,
      image: normalizeAssetUrl(banner.image),
    })))
  } catch {
    return publicJson(
      { error: 'Gagal mengambil data banner' },
      { status: 500 }
    )
  }
}

// POST /api/topup-banners — create a new banner (admin)
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
    const { title, subtitle, badge, image, link, color, order, active } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Judul banner wajib diisi' },
        { status: 400 }
      )
    }

    let bannerOrder = order ?? 0
    if (!order && order !== 0) {
      const banners = await db.topUpBanner.findMany({ select: { order: true } })
      bannerOrder = banners.reduce((max, item) => Math.max(max, item.order), -1) + 1
    }

    const banner = await db.topUpBanner.create({
      data: {
        title: title.trim(),
        subtitle: (subtitle || '').trim(),
        badge: (badge || 'PROMO').trim(),
        image: (image || '').trim(),
        link: (link || '').trim(),
        color: (color || 'from-purple-600 to-blue-500').trim(),
        order: bannerOrder,
        active: active ?? true,
      },
    })

    return NextResponse.json(banner, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambahkan banner' },
      { status: 500 }
    )
  }
}

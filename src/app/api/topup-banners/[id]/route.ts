import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/topup-banners/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const banner = await db.topUpBanner.findUnique({ where: { id } })
    if (!banner) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(banner)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data banner' }, { status: 500 })
  }
}

// PUT /api/topup-banners/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { title, subtitle, badge, image, link, color, order, active } = body

    const existing = await db.topUpBanner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 })
    }

    const banner = await db.topUpBanner.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(subtitle !== undefined ? { subtitle: (subtitle || '').trim() } : {}),
        ...(badge !== undefined ? { badge: (badge || 'PROMO').trim() } : {}),
        ...(image !== undefined ? { image: (image || '').trim() } : {}),
        ...(link !== undefined ? { link: (link || '').trim() } : {}),
        ...(color !== undefined ? { color: (color || 'from-purple-600 to-blue-500').trim() } : {}),
        ...(order !== undefined ? { order: order } : {}),
        ...(active !== undefined ? { active: active } : {}),
      },
    })

    return NextResponse.json(banner)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui banner' }, { status: 500 })
  }
}

// DELETE /api/topup-banners/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const existing = await db.topUpBanner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 })
    }

    await db.topUpBanner.delete({ where: { id } })
    return NextResponse.json({ message: 'Banner berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus banner' }, { status: 500 })
  }
}

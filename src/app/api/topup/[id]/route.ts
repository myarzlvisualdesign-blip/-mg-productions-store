import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/topup/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const topUpService = await db.topUpService.findUnique({ where: { id } })
    if (!topUpService) {
      return NextResponse.json({ error: 'Layanan top-up tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(topUpService)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data layanan top-up' }, { status: 500 })
  }
}

// PUT /api/topup/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { name, subtitle, emoji, color, items, image, link, order, active } = body

    const existing = await db.topUpService.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Layanan top-up tidak ditemukan' }, { status: 404 })
    }

    const topUpService = await db.topUpService.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(subtitle !== undefined ? { subtitle: (subtitle || '').trim() } : {}),
        ...(emoji !== undefined ? { emoji: (emoji || '🎮').trim() } : {}),
        ...(color !== undefined ? { color: (color || 'from-purple-600 to-purple-400').trim() } : {}),
        ...(items !== undefined ? { items: items } : {}),
        ...(image !== undefined ? { image: (image || '').trim() } : {}),
        ...(link !== undefined ? { link: (link || '').trim() } : {}),
        ...(order !== undefined ? { order: order } : {}),
        ...(active !== undefined ? { active: active } : {}),
      },
    })

    return NextResponse.json(topUpService)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui layanan top-up' }, { status: 500 })
  }
}

// DELETE /api/topup/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const existing = await db.topUpService.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Layanan top-up tidak ditemukan' }, { status: 404 })
    }

    await db.topUpService.delete({ where: { id } })
    return NextResponse.json({ message: 'Layanan top-up berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus layanan top-up' }, { status: 500 })
  }
}

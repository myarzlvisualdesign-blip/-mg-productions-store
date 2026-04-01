import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/travel/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const travelService = await db.travelService.findUnique({ where: { id } })
    if (!travelService) {
      return NextResponse.json({ error: 'Layanan travel tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(travelService)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data layanan travel' }, { status: 500 })
  }
}

// PUT /api/travel/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { name, subtitle, emoji, color, desc, image, link, order, active } = body

    const existing = await db.travelService.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Layanan travel tidak ditemukan' }, { status: 404 })
    }

    const travelService = await db.travelService.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(subtitle !== undefined ? { subtitle: (subtitle || '').trim() } : {}),
        ...(emoji !== undefined ? { emoji: (emoji || '✈️').trim() } : {}),
        ...(color !== undefined ? { color: (color || 'from-sky-600 to-blue-400').trim() } : {}),
        ...(desc !== undefined ? { desc: (desc || '').trim() } : {}),
        ...(image !== undefined ? { image: (image || '').trim() } : {}),
        ...(link !== undefined ? { link: (link || '').trim() } : {}),
        ...(order !== undefined ? { order: order } : {}),
        ...(active !== undefined ? { active: active } : {}),
      },
    })

    return NextResponse.json(travelService)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui layanan travel' }, { status: 500 })
  }
}

// DELETE /api/travel/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const existing = await db.travelService.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Layanan travel tidak ditemukan' }, { status: 404 })
    }

    await db.travelService.delete({ where: { id } })
    return NextResponse.json({ message: 'Layanan travel berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus layanan travel' }, { status: 500 })
  }
}

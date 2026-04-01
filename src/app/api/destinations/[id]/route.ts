import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/destinations/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const destination = await db.popularDestination.findUnique({ where: { id } })
    if (!destination) {
      return NextResponse.json({ error: 'Destinasi tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(destination)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data destinasi' }, { status: 500 })
  }
}

// PUT /api/destinations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { name, subtitle, emoji, color, image, order, active } = body

    const existing = await db.popularDestination.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Destinasi tidak ditemukan' }, { status: 404 })
    }

    const destination = await db.popularDestination.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(subtitle !== undefined ? { subtitle: (subtitle || '').trim() } : {}),
        ...(emoji !== undefined ? { emoji: (emoji || '📍').trim() } : {}),
        ...(color !== undefined ? { color: (color || 'from-purple-600 to-blue-400').trim() } : {}),
        ...(image !== undefined ? { image: (image || '').trim() } : {}),
        ...(order !== undefined ? { order: order } : {}),
        ...(active !== undefined ? { active: active } : {}),
      },
    })

    return NextResponse.json(destination)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui destinasi' }, { status: 500 })
  }
}

// DELETE /api/destinations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const existing = await db.popularDestination.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Destinasi tidak ditemukan' }, { status: 404 })
    }

    await db.popularDestination.delete({ where: { id } })
    return NextResponse.json({ message: 'Destinasi berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus destinasi' }, { status: 500 })
  }
}

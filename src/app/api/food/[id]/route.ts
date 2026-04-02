import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/food/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const foodItem = await db.foodItem.findUnique({ where: { id } })
    if (!foodItem) {
      return NextResponse.json({ error: 'Menu makanan tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(foodItem)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data menu makanan' }, { status: 500 })
  }
}

// PUT /api/food/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = requireAdmin(request)
    if (!authorized) {
      return NextResponse.json(
        { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
        { status: 401 }
      )
    }
    const { id } = await params
    const body = await request.json()
    const { name, subtitle, emoji, color, items, image, link, order, active } = body

    const existing = await db.foodItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Menu makanan tidak ditemukan' }, { status: 404 })
    }

    const foodItem = await db.foodItem.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(subtitle !== undefined ? { subtitle: (subtitle || '').trim() } : {}),
        ...(emoji !== undefined ? { emoji: (emoji || '🍜').trim() } : {}),
        ...(color !== undefined ? { color: (color || 'from-orange-600 to-orange-400').trim() } : {}),
        ...(items !== undefined ? { items: items } : {}),
        ...(image !== undefined ? { image: (image || '').trim() } : {}),
        ...(link !== undefined ? { link: (link || '').trim() } : {}),
        ...(order !== undefined ? { order: order } : {}),
        ...(active !== undefined ? { active: active } : {}),
      },
    })

    return NextResponse.json(foodItem)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui menu makanan' }, { status: 500 })
  }
}

// DELETE /api/food/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = requireAdmin(request)
    if (!authorized) {
      return NextResponse.json(
        { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
        { status: 401 }
      )
    }
    const { id } = await params
    const existing = await db.foodItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Menu makanan tidak ditemukan' }, { status: 404 })
    }

    await db.foodItem.delete({ where: { id } })
    return NextResponse.json({ message: 'Menu makanan berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus menu makanan' }, { status: 500 })
  }
}

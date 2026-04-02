import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/partners/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const partner = await db.partner.findUnique({ where: { id } })
    if (!partner) {
      return NextResponse.json({ error: 'Mitra tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(partner)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data mitra' }, { status: 500 })
  }
}

// PUT /api/partners/[id]
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
    const { name, description, image, link, order, active } = body

    const existing = await db.partner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mitra tidak ditemukan' }, { status: 404 })
    }

    const partner = await db.partner.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: (description || '').trim() } : {}),
        ...(image !== undefined ? { image: image.trim() } : {}),
        ...(link !== undefined ? { link: (link || '').trim() } : {}),
        ...(order !== undefined ? { order: order } : {}),
        ...(active !== undefined ? { active: active } : {}),
      },
    })

    return NextResponse.json(partner)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui mitra' }, { status: 500 })
  }
}

// DELETE /api/partners/[id]
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
    const existing = await db.partner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mitra tidak ditemukan' }, { status: 404 })
    }

    await db.partner.delete({ where: { id } })
    return NextResponse.json({ message: 'Mitra berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus mitra' }, { status: 500 })
  }
}

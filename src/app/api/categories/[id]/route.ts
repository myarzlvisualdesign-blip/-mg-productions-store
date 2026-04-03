import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/categories/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await db.category.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data kategori' }, { status: 500 })
  }
}

// PUT /api/categories/[id]
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
    const { name, order, active } = body

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    // Check uniqueness if name is being changed
    if (name && name.trim() && name.trim() !== existing.name) {
      const duplicate = await db.category.findFirst({
        where: { name: name.trim() },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Nama kategori sudah digunakan' },
          { status: 409 }
        )
      }
    }

    const nextName = name !== undefined ? name.trim() : existing.name
    const nameChanged = nextName !== existing.name

    const category = await db.$transaction(async (tx) => {
      const updatedCategory = await tx.category.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: nextName } : {}),
          ...(order !== undefined ? { order: order } : {}),
          ...(active !== undefined ? { active: active } : {}),
        },
      })

      if (nameChanged) {
        await tx.product.updateMany({
          where: { category: existing.name },
          data: { category: nextName },
        })
      }

      return updatedCategory
    })

    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 })
  }
}

// DELETE /api/categories/[id]
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
    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    // Check if any products use this category
    const productsWithCategory = await db.product.count({
      where: { category: existing.name },
    })
    if (productsWithCategory > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus — ${productsWithCategory} produk menggunakan kategori ini` },
        { status: 400 }
      )
    }

    await db.category.delete({ where: { id } })
    return NextResponse.json({ message: 'Kategori berhasil dihapus' })
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 })
  }
}

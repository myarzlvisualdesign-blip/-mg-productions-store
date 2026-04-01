import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PUBLIC — Siapa saja bisa lihat detail produk
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({ where: { id } })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// ADMIN ONLY — Update produk
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Whitelist allowed fields to prevent mass assignment
    const { name, description, price, image, category, stock, rating, featured, link } = body
    const product = await db.product.update({
      where: { id },
      data: { name, description, price, image, category, stock, rating, featured, link },
    })

    return NextResponse.json(product)
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengupdate produk' },
      { status: 500 }
    )
  }
}

// ADMIN ONLY — Hapus produk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    await db.product.delete({ where: { id } })

    return NextResponse.json({ message: 'Produk berhasil dihapus' })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menghapus produk' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'

// PUBLIC — Semua orang bisa melihat produk
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (category && category !== 'All') {
      where.category = category
    }
    if (featured === 'true') {
      where.featured = true
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return publicJson(products)
  } catch {
    return publicJson(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// ADMIN ONLY — Hanya admin yang bisa menambah produk
export async function POST(request: NextRequest) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { name, description, price, image, category, link, stock, featured, rating } = body

    if (!name || !description || price === undefined || !image || !category) {
      return NextResponse.json(
        { error: 'Field wajib belum lengkap' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        category,
        link: (link || '').trim(),
        stock: parseInt(stock) || 0,
        featured: featured || false,
        rating: rating || 0,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Gagal membuat produk' },
      { status: 500 }
    )
  }
}

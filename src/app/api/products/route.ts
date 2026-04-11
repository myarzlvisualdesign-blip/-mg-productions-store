import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { publicJson } from '@/lib/public-api'
import { normalizeAssetUrl } from '@/lib/asset-url'

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

// PUBLIC — Semua orang bisa melihat produk
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const limitParam = searchParams.get('limit')

    const where: Prisma.ProductWhereInput = {}
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : Number.NaN
    const take = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 24)
      : undefined

    if (category && category !== 'All') {
      where.category = category
    }
    if (featured === 'true') {
      where.featured = true
    }
    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const normalizedSearch = search ? normalizeSearchValue(search) : ''
    const filteredProducts = normalizedSearch
      ? products.filter((product) => (
          normalizeSearchValue(`${product.name} ${product.description} ${product.category}`)
            .includes(normalizedSearch)
        ))
      : products
    const visibleProducts = take ? filteredProducts.slice(0, take) : filteredProducts

    return publicJson(visibleProducts.map((product) => ({
      ...product,
      image: normalizeAssetUrl(product.image),
    })))
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

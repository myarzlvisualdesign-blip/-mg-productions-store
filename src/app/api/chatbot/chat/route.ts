import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCanonicalChatbotSettings } from '@/lib/chatbot-settings'

const DEFAULT_SYSTEM_PROMPT = 'Kamu adalah MG Assistant untuk MG PRODUCTIONS. Kamu hanya membantu pertanyaan seputar produk, pencarian barang, checkout, top up, food, travel, referral, promo, dan fitur toko. Jika pertanyaan di luar topik toko, arahkan kembali ke layanan MG PRODUCTIONS.'

const STOP_WORDS = new Set([
  'apa', 'ada', 'yang', 'dan', 'atau', 'untuk', 'dengan', 'tentang', 'dong', 'nih',
  'ya', 'yaa', 'sih', 'saya', 'aku', 'mau', 'cari', 'coba', 'tolong', 'butuh',
  'produk', 'barang', 'mg', 'productions', 'info', 'informasi', 'please', 'tersedia',
])

const SEARCH_ALIASES: Record<string, string[]> = {
  kamera: ['camera', 'kamera'],
  camera: ['camera', 'kamera'],
  hp: ['smartphone', 'phone', 'hp'],
  handphone: ['smartphone', 'phone', 'handphone'],
  laptop: ['laptop', 'notebook'],
}

function friendlyIntro(name?: string) {
  const assistantName = name?.trim() || 'MG Assistant'
  return `Haii, aku ${assistantName}. Aku siap bantu kamu seputar e-commerce MG PRODUCTIONS, mulai dari cari produk, checkout, promo, referral, top up, food, sampai travel.`
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatRupiah(value: number) {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`
}

function buildSearchTerms(message: string) {
  const baseTerms = normalizeText(message)
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && !STOP_WORDS.has(part))
    .slice(0, 5)

  return Array.from(
    new Set(
      baseTerms.flatMap((term) => SEARCH_ALIASES[term] || [term])
    )
  ).slice(0, 8)
}

function hasAnyKeyword(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(keyword))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json(
        { error: 'Message wajib diisi' },
        { status: 400 }
      )
    }

    const settings = await getCanonicalChatbotSettings()
    if (settings && !settings.enabled) {
      return NextResponse.json(
        { error: 'Chatbot is currently disabled' },
        { status: 503 }
      )
    }

    const normalized = normalizeText(message)
    const searchTerms = buildSearchTerms(message)
    const isProductIntent = hasAnyKeyword(normalized, [
      'produk', 'barang', 'catalog', 'katalog', 'tersedia', 'available',
      'rekomendasi', 'cari', 'search', 'shop', 'belanja',
    ]) || searchTerms.length > 0
    const activeReferralSettings = await db.referralSettings.findFirst({
      select: { enabled: true, minOrderAmount: true, refereeReward: true },
    })

    if (hasAnyKeyword(normalized, ['halo', 'hai', 'hello', 'pagi', 'siang', 'malam'])) {
      return NextResponse.json({
        response: `${friendlyIntro(settings?.name)} Kalau kamu mau, langsung bilang aja mau cari produk apa atau butuh info layanan yang mana.`,
      })
    }

    if (hasAnyKeyword(normalized, ['checkout', 'bayar', 'pembayaran', 'order', 'pesan', 'keranjang', 'cart'])) {
      return NextResponse.json({
        response: 'Siapp. Untuk belanja, pilih produk lalu masukkan ke keranjang. Setelah itu lanjut checkout dari cart. Kalau produk punya tombol Visit, berarti produk itu diarahkan ke link eksternal. Kalau ada kendala pembayaran atau order, admin toko bisa bantu lanjut.',
      })
    }

    if (hasAnyKeyword(normalized, ['referral', 'kode promo', 'promo', 'diskon'])) {
      if (activeReferralSettings?.enabled) {
        return NextResponse.json({
          response: `Program referral lagi aktif yaa. Minimum order untuk benefit referral adalah ${formatRupiah(activeReferralSettings.minOrderAmount)}, dan pelanggan baru yang pakai kode referral bisa dapat reward ${formatRupiah(activeReferralSettings.refereeReward)}.`,
        })
      }

      return NextResponse.json({
        response: 'Saat ini fitur referral belum aktif, tapi kamu tetap bisa belanja produk, top up, food, dan travel seperti biasa di MG PRODUCTIONS.',
      })
    }

    if (hasAnyKeyword(normalized, ['topup', 'top up', 'diamond', 'koin', 'game', 'voucher'])) {
      const services = await db.topUpService.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
        take: 5,
        select: { name: true, subtitle: true },
      })

      if (services.length === 0) {
        return NextResponse.json({
          response: 'Saat ini belum ada layanan top up yang aktif. Coba cek lagi nanti ya, atau kalau mau saya bisa bantu arahkan ke layanan toko lain yang tersedia.',
        })
      }

      const summary = services
        .map((service) => service.subtitle ? `${service.name} (${service.subtitle})` : service.name)
        .join(', ')

      return NextResponse.json({
        response: `Untuk top up, yang tersedia saat ini antara lain: ${summary}. Kalau kamu mau, sebutkan game atau layanan yang dicari biar aku bantu arahkan lebih spesifik.`,
      })
    }

    if (hasAnyKeyword(normalized, ['food', 'makan', 'minum', 'drink', 'menu', 'kuliner'])) {
      const items = await db.foodItem.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
        take: 5,
        select: { name: true, subtitle: true },
      })

      if (items.length === 0) {
        return NextResponse.json({
          response: 'Saat ini belum ada menu food & drink yang aktif di toko.',
        })
      }

      return NextResponse.json({
        response: `Menu food & drink yang aktif saat ini: ${items.map((item) => item.subtitle ? `${item.name} (${item.subtitle})` : item.name).join(', ')}. Kalau mau, aku juga bisa bantu pilihkan yang paling cocok.`,
      })
    }

    if (hasAnyKeyword(normalized, ['travel', 'wisata', 'liburan', 'destinasi', 'trip'])) {
      const [services, destinations] = await Promise.all([
        db.travelService.findMany({
          where: { active: true },
          orderBy: { order: 'asc' },
          take: 4,
          select: { name: true, subtitle: true },
        }),
        db.popularDestination.findMany({
          where: { active: true },
          orderBy: { order: 'asc' },
          take: 4,
          select: { name: true, subtitle: true },
        }),
      ])

      const parts: string[] = []
      if (services.length > 0) {
        parts.push(`layanan travel: ${services.map((item) => item.subtitle ? `${item.name} (${item.subtitle})` : item.name).join(', ')}`)
      }
      if (destinations.length > 0) {
        parts.push(`destinasi populer: ${destinations.map((item) => item.subtitle ? `${item.name} (${item.subtitle})` : item.name).join(', ')}`)
      }

      return NextResponse.json({
        response: parts.length > 0
          ? `Untuk travel, yang tersedia saat ini ada ${parts.join(' | ')}.`
          : 'Saat ini belum ada layanan travel atau destinasi aktif yang tampil di toko.',
      })
    }

    if (hasAnyKeyword(normalized, ['produk apa saja', 'produk tersedia', 'barang tersedia', 'list produk', 'daftar produk'])) {
      const featuredProducts = await db.product.findMany({
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 6,
        select: {
          name: true,
          category: true,
          price: true,
          stock: true,
        },
      })

      if (featuredProducts.length === 0) {
        return NextResponse.json({
          response: 'Saat ini belum ada produk yang tampil di katalog store. Kalau nanti produk sudah ditambahkan, aku bisa bantu tampilkan daftarnya di sini.',
        })
      }

      return NextResponse.json({
        response: `Produk yang tersedia saat ini antara lain:\n${featuredProducts.map((product) => `- ${product.name} • ${product.category} • ${formatRupiah(product.price)} • ${product.stock > 0 ? `${product.stock} stok` : 'stok habis'}`).join('\n')}\n\nKalau mau, kamu bisa lanjut minta aku carikan kategori atau budget tertentu.`,
      })
    }

    const products = await db.product.findMany({
      where: searchTerms.length > 0
        ? {
            OR: searchTerms.flatMap((term) => ([
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { category: { contains: term, mode: 'insensitive' } },
            ])),
          }
        : undefined,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 5,
      select: {
        name: true,
        category: true,
        price: true,
        stock: true,
      },
    })

    if (products.length > 0) {
      const lines = products.map((product) => {
        const stockNote = product.stock > 0 ? `${product.stock} stok` : 'stok habis'
        return `- ${product.name} • ${product.category} • ${formatRupiah(product.price)} • ${stockNote}`
      })

      return NextResponse.json({
        response: `Aku temukan beberapa produk yang relevan buat kamu:\n${lines.join('\n')}\n\nKalau mau, sebutkan nama, kategori, atau budget yang lebih spesifik supaya aku saring lagi.`,
      })
    }

    if (isProductIntent) {
      const totalProducts = await db.product.count()

      if (totalProducts === 0) {
        return NextResponse.json({
          response: 'Saat ini katalog produk store sedang kosong, jadi aku tidak bisa merekomendasikan produk apa pun. Kalau kamu mau, aku masih bisa bantu info top up, food, travel, checkout, atau referral.',
        })
      }

      return NextResponse.json({
        response: 'Aku belum menemukan produk yang cocok dengan kata kunci itu di katalog saat ini. Coba ketik nama produk yang lebih spesifik, kategori, atau rentang budget yang kamu cari ya.',
      })
    }

    if (hasAnyKeyword(normalized, ['produk', 'catalog', 'katalog', 'tersedia', 'available', 'rekomendasi'])) {
      const featuredProducts = await db.product.findMany({
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 5,
        select: {
          name: true,
          category: true,
          price: true,
        },
      })

      if (featuredProducts.length === 0) {
        return NextResponse.json({
          response: 'Saat ini belum ada produk yang tampil di katalog.',
        })
      }

      return NextResponse.json({
        response: `Beberapa produk yang tersedia saat ini: ${featuredProducts.map((product) => `${product.name} (${product.category}, ${formatRupiah(product.price)})`).join(', ')}. Kalau kamu mau cari tipe tertentu, tinggal sebutkan aja ya.`,
      })
    }

    return NextResponse.json({
      response: `${friendlyIntro(settings?.name)} Aku fokus bantu pertanyaan seputar produk, pencarian barang, cart, checkout, top up, food, travel, promo, dan referral. Kalau kamu cari barang tertentu, sebutkan nama atau kategorinya ya.`,
    })
  } catch (error) {
    console.error('Chatbot API error:', error)
    return NextResponse.json(
      { error: 'Gagal memproses pesan' },
      { status: 500 }
    )
  }
}

export function GET() {
  return NextResponse.json({
    status: 'ok',
    mode: 'catalog-assistant',
    prompt: DEFAULT_SYSTEM_PROMPT,
  })
}

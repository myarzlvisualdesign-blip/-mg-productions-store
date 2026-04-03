import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCanonicalChatbotSettings } from '@/lib/chatbot-settings'
import { getCanonicalReferralSettings } from '@/lib/referral-settings'

const DEFAULT_SYSTEM_PROMPT =
  'Kamu adalah MG Assistant untuk MG PRODUCTIONS. Kamu hanya membantu pertanyaan seputar produk, pencarian barang, checkout, top up, food, travel, referral, promo, dan fitur toko. Jika pertanyaan di luar topik toko, arahkan kembali ke layanan MG PRODUCTIONS.'

const SESSION_TTL_MS = 30 * 60 * 1000
const MAX_PRODUCT_RESULTS = 5

type AssistantIntent =
  | 'greeting'
  | 'gratitude'
  | 'capabilities'
  | 'checkout'
  | 'referral'
  | 'topup'
  | 'food'
  | 'travel'
  | 'product_list'
  | 'product_search'
  | 'product_recommendation'
  | 'product_compare'
  | 'out_of_scope'
  | 'fallback'

type AssistantDomain =
  | 'product'
  | 'topup'
  | 'food'
  | 'travel'
  | 'checkout'
  | 'referral'
  | 'general'

interface ProductSearchContext {
  searchTerms: string[]
  budgetMin?: number
  budgetMax?: number
  stockOnly: boolean
  wantsCheaper: boolean
  wantsFeatured: boolean
  wantsBest: boolean
  useCases: string[]
}

interface SessionMemory {
  updatedAt: number
  lastIntent?: AssistantIntent
  lastDomain?: AssistantDomain
  lastSearch?: ProductSearchContext
  awaiting?: 'product-clarification'
}

interface ProductCandidate {
  name: string
  category: string
  description: string
  price: number
  stock: number
  featured: boolean
  rating: number
}

const sessionMemory = new Map<string, SessionMemory>()

const STOP_WORDS = new Set([
  'apa', 'ada', 'yang', 'dan', 'atau', 'untuk', 'dengan', 'tentang', 'dong', 'nih',
  'ya', 'yaa', 'sih', 'saya', 'aku', 'mau', 'cari', 'coba', 'tolong', 'butuh',
  'produk', 'barang', 'mg', 'productions', 'info', 'informasi', 'please', 'tersedia',
  'yangnya', 'dongg', 'nihh', 'kak', 'min', 'buat', 'dari', 'ke', 'ini', 'itu',
  'aja', 'saja', 'bisa', 'kah', 'lagi', 'lebih', 'ingin', 'nyari', 'cariin',
])

const SEARCH_ALIASES: Record<string, string[]> = {
  kamera: ['kamera', 'camera', 'photography', 'foto'],
  camera: ['camera', 'kamera', 'photography', 'foto'],
  hp: ['smartphone', 'phone', 'hp', 'handphone'],
  handphone: ['smartphone', 'phone', 'handphone', 'hp'],
  laptop: ['laptop', 'notebook'],
  tas: ['tas', 'bag', 'backpack'],
  bag: ['bag', 'tas', 'backpack'],
  keyboard: ['keyboard', 'mechanical', 'keycaps'],
  audio: ['audio', 'speaker', 'headphone', 'earbuds'],
  charger: ['charger', 'charging', 'dock'],
}

const USE_CASE_ALIASES: Record<string, string[]> = {
  gaming: ['game', 'gaming', 'gamer', 'rgb', 'mechanical'],
  kerja: ['kerja', 'office', 'kantor', 'produktif', 'laptop'],
  content: ['content', 'creator', 'konten', 'editing', 'video', 'foto', 'camera', 'kamera'],
  travel: ['travel', 'trip', 'jalanan', 'portable', 'ringan'],
  audio: ['audio', 'musik', 'speaker', 'headphone', 'earbuds'],
  lifestyle: ['fashion', 'stylish', 'daily', 'gift', 'hadiah'],
}

const PRODUCT_INTENT_KEYWORDS = [
  'produk', 'barang', 'catalog', 'katalog', 'belanja', 'shop', 'kategori',
  'rekomendasi', 'sarankan', 'saran', 'pilihin', 'pilihkan', 'cocok', 'cari',
  'nyari', 'ada yang', 'budget', 'murah', 'mahal', 'stok', 'ready', 'ready stock',
]

const FOLLOW_UP_FILTER_KEYWORDS = [
  'yang', 'kalau', 'lebih murah', 'dibawah', 'di bawah', 'budget', 'stok',
  'ready', 'tersedia', 'featured', 'unggulan', 'terbaik', 'murah', 'mahal',
]

const OUT_OF_SCOPE_KEYWORDS = [
  'cuaca', 'politik', 'presiden', 'berita', 'matematika', 'koding', 'coding',
  'programming', 'saham', 'crypto', 'horoskop', 'zodiak', 'resep', 'dokter',
]

function friendlyIntro(name?: string) {
  const assistantName = name?.trim() || 'MG Assistant'
  return `Hai, aku ${assistantName}. Aku bantu jawab soal produk, checkout, promo, referral, top up, food, dan travel di MG PRODUCTIONS.`
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

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function joinNatural(items: string[]) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} dan ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, dan ${items[items.length - 1]}`
}

function buildSearchTerms(message: string) {
  const baseTerms = normalizeText(message)
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && !STOP_WORDS.has(part))
    .slice(0, 6)

  return unique(
    baseTerms.flatMap((term) => SEARCH_ALIASES[term] || [term])
  ).slice(0, 10)
}

function hasAnyKeyword(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(keyword))
}

function cleanupSessionMemory() {
  const now = Date.now()
  for (const [sessionId, state] of sessionMemory.entries()) {
    if (now - state.updatedAt > SESSION_TTL_MS) {
      sessionMemory.delete(sessionId)
    }
  }
}

function getSession(sessionId: string) {
  cleanupSessionMemory()
  return sessionMemory.get(sessionId)
}

function saveSession(sessionId: string, patch: Partial<SessionMemory>) {
  const current = sessionMemory.get(sessionId)
  sessionMemory.set(sessionId, {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  })
}

function parseMoneyValue(raw: string) {
  const compact = raw
    .toLowerCase()
    .replace(/rp/g, '')
    .replace(/\s+/g, '')
    .trim()

  const unitMatch = compact.match(/^(\d+(?:[.,]\d+)?)(jt|juta|rb|ribu|k)$/)
  if (unitMatch) {
    const numeric = Number.parseFloat(unitMatch[1].replace(',', '.'))
    if (!Number.isFinite(numeric)) return null

    const unit = unitMatch[2]
    if (unit === 'jt' || unit === 'juta') return numeric * 1_000_000
    return numeric * 1_000
  }

  const digitsOnly = compact.replace(/[^\d]/g, '')
  if (!digitsOnly) return null

  const numeric = Number.parseInt(digitsOnly, 10)
  return Number.isFinite(numeric) ? numeric : null
}

function extractBudgetContext(message: string) {
  const lower = message.toLowerCase()
  const values = Array.from(
    lower.matchAll(/rp?\s*\d[\d.,]*(?:\s*(?:jt|juta|rb|ribu|k))?/gi)
  )
    .map((match) => parseMoneyValue(match[0]))
    .filter((value): value is number => value !== null)

  if (values.length === 0) {
    return {} as { min?: number; max?: number }
  }

  if (
    values.length >= 2 &&
    hasAnyKeyword(lower, ['antara', 'kisaran', 'range', 'sampai', 'hingga', 'sd'])
  ) {
    const [first, second] = values
    return {
      min: Math.min(first, second),
      max: Math.max(first, second),
    }
  }

  if (hasAnyKeyword(lower, ['dibawah', 'di bawah', 'under', 'maks', 'maksimal', 'max', 'kurang dari'])) {
    return { max: values[0] }
  }

  if (hasAnyKeyword(lower, ['diatas', 'di atas', 'lebih dari', 'minimal', 'min', 'mulai dari', 'start'])) {
    return { min: values[0] }
  }

  if (hasAnyKeyword(lower, ['budget', 'kisaran', 'sekitar', 'harga'])) {
    return { max: values[0] }
  }

  return { max: values[0] }
}

function extractUseCases(normalized: string) {
  return Object.entries(USE_CASE_ALIASES)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([useCase]) => useCase)
}

function mergeSearchContext(
  previous: ProductSearchContext | undefined,
  current: ProductSearchContext,
  shouldMerge: boolean
): ProductSearchContext {
  if (!previous || !shouldMerge) {
    return current
  }

  return {
    searchTerms: unique([...previous.searchTerms, ...current.searchTerms]).slice(0, 10),
    budgetMin: current.budgetMin ?? previous.budgetMin,
    budgetMax: current.budgetMax ?? previous.budgetMax,
    stockOnly: current.stockOnly || previous.stockOnly,
    wantsCheaper: current.wantsCheaper || previous.wantsCheaper,
    wantsFeatured: current.wantsFeatured || previous.wantsFeatured,
    wantsBest: current.wantsBest || previous.wantsBest,
    useCases: unique([...previous.useCases, ...current.useCases]),
  }
}

function extractSearchContext(
  message: string,
  previous?: ProductSearchContext
) {
  const normalized = normalizeText(message)
  const budget = extractBudgetContext(message)
  const current: ProductSearchContext = {
    searchTerms: buildSearchTerms(message),
    budgetMin: budget.min,
    budgetMax: budget.max,
    stockOnly: hasAnyKeyword(normalized, ['stok', 'ready', 'ready stock', 'stock ready', 'instock', 'in stock']),
    wantsCheaper: hasAnyKeyword(normalized, ['murah', 'lebih murah', 'termurah', 'hemat']),
    wantsFeatured: hasAnyKeyword(normalized, ['featured', 'unggulan', 'highlight']),
    wantsBest: hasAnyKeyword(normalized, ['terbaik', 'best', 'favorit', 'populer', 'recommended']),
    useCases: extractUseCases(normalized),
  }

  const shouldMerge =
    Boolean(previous) &&
    (
      current.searchTerms.length === 0 ||
      current.budgetMin !== undefined ||
      current.budgetMax !== undefined ||
      current.stockOnly ||
      current.wantsCheaper ||
      current.wantsFeatured ||
      current.wantsBest ||
      current.useCases.length > 0 ||
      hasAnyKeyword(normalized, FOLLOW_UP_FILTER_KEYWORDS)
    )

  return mergeSearchContext(previous, current, shouldMerge)
}

function detectIntent(
  normalized: string,
  searchContext: ProductSearchContext,
  session?: SessionMemory
): AssistantIntent {
  if (hasAnyKeyword(normalized, ['halo', 'hai', 'hello', 'pagi', 'siang', 'malam'])) {
    return 'greeting'
  }

  if (hasAnyKeyword(normalized, ['makasih', 'terima kasih', 'thanks', 'thank you'])) {
    return 'gratitude'
  }

  if (hasAnyKeyword(normalized, ['bisa bantu apa', 'kamu bisa apa', 'fitur apa', 'bantu apa'])) {
    return 'capabilities'
  }

  if (
    hasAnyKeyword(normalized, ['bandingkan', 'compare', 'vs', 'versus', 'bedanya']) &&
    (
      session?.lastDomain === 'product' ||
      hasAnyKeyword(normalized, ['produk', 'barang', 'kategori', 'rekomendasi'])
    )
  ) {
    return 'product_compare'
  }

  if (hasAnyKeyword(normalized, ['checkout', 'bayar', 'pembayaran', 'order', 'pesan', 'keranjang', 'cart'])) {
    return 'checkout'
  }

  if (hasAnyKeyword(normalized, ['referral', 'kode promo', 'promo', 'diskon'])) {
    return 'referral'
  }

  if (hasAnyKeyword(normalized, ['topup', 'top up', 'diamond', 'koin', 'game', 'voucher'])) {
    return 'topup'
  }

  if (hasAnyKeyword(normalized, ['food', 'makan', 'minum', 'drink', 'menu', 'kuliner'])) {
    return 'food'
  }

  if (hasAnyKeyword(normalized, ['travel', 'wisata', 'liburan', 'destinasi', 'trip'])) {
    return 'travel'
  }

  if (
    hasAnyKeyword(normalized, OUT_OF_SCOPE_KEYWORDS) &&
    !hasAnyKeyword(normalized, [...PRODUCT_INTENT_KEYWORDS, 'topup', 'food', 'travel'])
  ) {
    return 'out_of_scope'
  }

  if (hasAnyKeyword(normalized, ['produk apa saja', 'produk tersedia', 'barang tersedia', 'list produk', 'daftar produk'])) {
    return 'product_list'
  }

  const recommendationSignals =
    hasAnyKeyword(normalized, ['rekomendasi', 'sarankan', 'pilihkan', 'pilihin', 'cocok', 'gift', 'hadiah']) ||
    searchContext.budgetMin !== undefined ||
    searchContext.budgetMax !== undefined ||
    searchContext.useCases.length > 0 ||
    searchContext.wantsBest ||
    searchContext.wantsCheaper

  const productSignals =
    hasAnyKeyword(normalized, PRODUCT_INTENT_KEYWORDS) ||
    recommendationSignals ||
    (searchContext.searchTerms.length > 0 && hasAnyKeyword(normalized, ['ada', 'butuh', 'mau', 'pengen', 'lihat', 'nyari', 'cari'])) ||
    (session?.lastDomain === 'product' && (
      searchContext.searchTerms.length > 0 ||
      searchContext.budgetMin !== undefined ||
      searchContext.budgetMax !== undefined ||
      searchContext.stockOnly ||
      hasAnyKeyword(normalized, FOLLOW_UP_FILTER_KEYWORDS)
    ))

  if (productSignals) {
    return recommendationSignals ? 'product_recommendation' : 'product_search'
  }

  if (hasAnyKeyword(normalized, ['produk', 'catalog', 'katalog', 'barang'])) {
    return 'product_list'
  }

  return 'fallback'
}

function describeSearchContext(search: ProductSearchContext) {
  const parts: string[] = []

  if (search.searchTerms.length > 0) {
    parts.push(`kata kunci ${joinNatural(search.searchTerms.slice(0, 3))}`)
  }

  if (search.budgetMin !== undefined && search.budgetMax !== undefined) {
    parts.push(`budget ${formatRupiah(search.budgetMin)} sampai ${formatRupiah(search.budgetMax)}`)
  } else if (search.budgetMax !== undefined) {
    parts.push(`budget sampai ${formatRupiah(search.budgetMax)}`)
  } else if (search.budgetMin !== undefined) {
    parts.push(`budget mulai ${formatRupiah(search.budgetMin)}`)
  }

  if (search.stockOnly) {
    parts.push('stok ready')
  }

  if (search.useCases.length > 0) {
    parts.push(`kebutuhan ${joinNatural(search.useCases)}`)
  }

  return parts.length > 0 ? joinNatural(parts) : 'kebutuhan kamu'
}

function buildProductSummaryLine(product: ProductCandidate) {
  const stockNote = product.stock > 0 ? `${product.stock} stok` : 'stok habis'
  return `- ${product.name} • ${product.category} • ${formatRupiah(product.price)} • ${stockNote}`
}

function productMatchesSearch(product: ProductCandidate, search: ProductSearchContext) {
  if (search.stockOnly && product.stock <= 0) {
    return false
  }

  if (search.budgetMin !== undefined && product.price < search.budgetMin) {
    return false
  }

  if (search.budgetMax !== undefined && product.price > search.budgetMax) {
    return false
  }

  if (search.searchTerms.length === 0) {
    return true
  }

  const haystack = normalizeText(`${product.name} ${product.category} ${product.description}`)
  return search.searchTerms.some((term) => haystack.includes(term))
}

function scoreProduct(product: ProductCandidate, search: ProductSearchContext) {
  const haystack = normalizeText(`${product.name} ${product.category} ${product.description}`)
  const name = normalizeText(product.name)
  const category = normalizeText(product.category)

  let score = 0

  for (const term of search.searchTerms) {
    if (name.includes(term)) {
      score += 10
      continue
    }

    if (category.includes(term)) {
      score += 6
      continue
    }

    if (haystack.includes(term)) {
      score += 4
    }
  }

  for (const useCase of search.useCases) {
    const aliases = USE_CASE_ALIASES[useCase] || []
    if (aliases.some((keyword) => haystack.includes(keyword))) {
      score += 4
    }
  }

  if (product.stock > 0) {
    score += 2
  }

  if (product.featured) {
    score += search.wantsFeatured || search.wantsBest ? 4 : 2
  }

  if (search.wantsCheaper) {
    score += Math.max(0, 5 - Math.floor(product.price / 1_000_000))
  }

  score += Math.min(product.rating, 5)

  return score
}

async function getProductRecommendations(search: ProductSearchContext) {
  const broadSearch = search.searchTerms.length === 0
  const candidates = await db.product.findMany({
    where: broadSearch
      ? undefined
      : {
          OR: search.searchTerms.flatMap((term) => ([
            { name: { contains: term, mode: 'insensitive' as const } },
            { description: { contains: term, mode: 'insensitive' as const } },
            { category: { contains: term, mode: 'insensitive' as const } },
          ])),
        },
    orderBy: [
      { featured: 'desc' },
      { stock: 'desc' },
      { createdAt: 'desc' },
    ],
    take: broadSearch ? 24 : 18,
    select: {
      name: true,
      category: true,
      description: true,
      price: true,
      stock: true,
      featured: true,
      rating: true,
    },
  })

  const filtered = candidates
    .filter((product) => productMatchesSearch(product, search))
    .sort((left, right) => scoreProduct(right, search) - scoreProduct(left, search))

  if (filtered.length > 0) {
    return filtered.slice(0, MAX_PRODUCT_RESULTS)
  }

  if (search.searchTerms.length === 0) {
    return []
  }

  const fallbackWhere =
    search.budgetMin !== undefined || search.budgetMax !== undefined
      ? {
          price: {
            ...(search.budgetMin !== undefined ? { gte: search.budgetMin } : {}),
            ...(search.budgetMax !== undefined ? { lte: search.budgetMax } : {}),
          },
        }
      : undefined

  const fallbackCandidates = await db.product.findMany({
    where: fallbackWhere,
    orderBy: [
      { featured: 'desc' },
      { stock: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 12,
    select: {
      name: true,
      category: true,
      description: true,
      price: true,
      stock: true,
      featured: true,
      rating: true,
    },
  })

  return fallbackCandidates
    .filter((product) => productMatchesSearch(product, {
      ...search,
      searchTerms: [],
    }))
    .sort((left, right) => scoreProduct(right, search) - scoreProduct(left, search))
    .slice(0, MAX_PRODUCT_RESULTS)
}

function buildCapabilitiesResponse(name?: string) {
  return `${friendlyIntro(name)} Aku bisa bantu carikan produk berdasarkan nama, kategori, atau budget; kasih rekomendasi yang lebih cocok; jelasin checkout dan cart; serta kasih info top up, food, travel, promo, dan referral. Kalau mau langsung praktis, tinggal bilang misalnya "cariin produk budget 1 juta" atau "info top up yang aktif".`
}

async function handleProductIntent(
  searchContext: ProductSearchContext,
  sessionId: string,
  assistantName?: string
) {
  const hasMeaningfulRequest =
    searchContext.searchTerms.length > 0 ||
    searchContext.budgetMin !== undefined ||
    searchContext.budgetMax !== undefined ||
    searchContext.useCases.length > 0 ||
    searchContext.wantsBest ||
    searchContext.wantsCheaper ||
    searchContext.stockOnly

  if (!hasMeaningfulRequest) {
    saveSession(sessionId, {
      lastIntent: 'product_recommendation',
      lastDomain: 'product',
      lastSearch: searchContext,
      awaiting: 'product-clarification',
    })

    return NextResponse.json({
      response: `${friendlyIntro(assistantName)} Biar aku carikan yang pas, kamu tinggal kasih salah satu patokan ini: nama produk, kategori, atau budget. Contoh: "kamera di bawah 2 juta" atau "rekomendasi aksesori yang stok ready".`,
    })
  }

  const recommendations = await getProductRecommendations(searchContext)

  saveSession(sessionId, {
    lastIntent: searchContext.wantsBest || searchContext.wantsCheaper || searchContext.useCases.length > 0
      ? 'product_recommendation'
      : 'product_search',
    lastDomain: 'product',
    lastSearch: searchContext,
    awaiting: undefined,
  })

  if (recommendations.length === 0) {
    const totalProducts = await db.product.count()

    if (totalProducts === 0) {
      return NextResponse.json({
        response: 'Saat ini katalog produk store masih kosong, jadi aku belum bisa kasih rekomendasi. Kalau mau, aku tetap bisa bantu info top up, food, travel, checkout, atau referral.',
      })
    }

    return NextResponse.json({
      response: `Aku belum nemu produk yang cocok untuk ${describeSearchContext(searchContext)}. Coba longgarkan filternya sedikit, ganti kata kunci, atau kasih budget lain, nanti aku saring lagi.`,
    })
  }

  const summaryLines = recommendations.map(buildProductSummaryLine).join('\n')
  const opener = searchContext.wantsBest || searchContext.useCases.length > 0
    ? `Aku pilihkan beberapa opsi yang paling nyambung untuk ${describeSearchContext(searchContext)}:`
    : `Aku temukan beberapa produk yang cocok untuk ${describeSearchContext(searchContext)}:`

  return NextResponse.json({
    response: `${opener}\n${summaryLines}\n\nKalau mau, aku bisa lanjut saring lagi misalnya yang paling murah, yang stok paling aman, atau yang dari kategori tertentu.`,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const sessionId = typeof body?.sessionId === 'string' && body.sessionId.trim()
      ? body.sessionId.trim()
      : 'default'

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
    const session = getSession(sessionId)
    const searchContext = extractSearchContext(message, session?.lastSearch)
    const intent = detectIntent(normalized, searchContext, session)

    if (intent === 'greeting') {
      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'general',
        awaiting: undefined,
      })

      return NextResponse.json({
        response: `${friendlyIntro(settings?.name)} Kalau kamu mau, langsung bilang kebutuhanmu saja. Aku bisa bantu carikan produk, kasih rekomendasi by budget, atau jelasin layanan yang aktif.`,
      })
    }

    if (intent === 'gratitude') {
      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: session?.lastDomain ?? 'general',
      })

      return NextResponse.json({
        response: 'Sama-sama. Kalau mau lanjut, tinggal bilang targetmu saja, misalnya budget, kategori, atau layanan yang ingin dicek.',
      })
    }

    if (intent === 'capabilities') {
      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'general',
      })

      return NextResponse.json({
        response: buildCapabilitiesResponse(settings?.name),
      })
    }

    if (intent === 'out_of_scope') {
      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'general',
      })

      return NextResponse.json({
        response: `${friendlyIntro(settings?.name)} Untuk pertanyaan di luar layanan toko aku belum bantu jawab. Tapi kalau kamu butuh produk, checkout, top up, food, travel, promo, atau referral, aku bisa bantu lebih detail.`,
      })
    }

    if (intent === 'product_compare') {
      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'product',
        lastSearch: searchContext,
      })

      return NextResponse.json({
        response: 'Bisa. Untuk compare yang rapi, kirim dua nama produk yang mau dibandingkan, atau kasih satu kategori plus budgetmu dulu. Nanti aku bantu bedakan harga, stok, dan kecocokannya.',
      })
    }

    if (intent === 'checkout') {
      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'checkout',
      })

      return NextResponse.json({
        response: 'Untuk checkout, pilih produk lalu masukkan ke cart. Setelah itu lanjut dari keranjang ke halaman checkout. Kalau produknya punya tombol Visit, berarti prosesnya diarahkan ke link eksternal. Kalau kamu bingung di langkah tertentu, bilang bagian mana yang mentok dan aku bantu jelaskan.',
      })
    }

    if (intent === 'referral') {
      const activeReferralSettings = await getCanonicalReferralSettings()

      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'referral',
      })

      if (activeReferralSettings?.enabled) {
        return NextResponse.json({
          response: `Program referral lagi aktif. Minimum order untuk benefit referral adalah ${formatRupiah(activeReferralSettings.minOrderAmount)}, dan pelanggan baru yang pakai kode referral bisa dapat reward ${formatRupiah(activeReferralSettings.refereeReward)}. Kalau kamu mau, aku juga bisa jelaskan alur pakai kode referralnya.`,
        })
      }

      return NextResponse.json({
        response: 'Saat ini fitur referral belum aktif. Tapi kamu tetap bisa belanja produk, top up, food, dan travel seperti biasa di MG PRODUCTIONS.',
      })
    }

    if (intent === 'topup') {
      const services = await db.topUpService.findMany({
        where: searchContext.searchTerms.length > 0
          ? {
              active: true,
              OR: searchContext.searchTerms.flatMap((term) => ([
                { name: { contains: term, mode: 'insensitive' } },
                { subtitle: { contains: term, mode: 'insensitive' } },
                { items: { contains: term, mode: 'insensitive' } },
              ])),
            }
          : { active: true },
        orderBy: { order: 'asc' },
        take: 5,
        select: { name: true, subtitle: true },
      })

      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'topup',
      })

      if (services.length === 0) {
        return NextResponse.json({
          response: 'Saat ini belum ada layanan top up yang cocok dengan kata kunci itu. Coba sebutkan game, nominal, atau jenis voucher yang kamu cari, nanti aku bantu arahkan lagi.',
        })
      }

      const summary = services
        .map((service) => service.subtitle ? `${service.name} (${service.subtitle})` : service.name)
        .join(', ')

      return NextResponse.json({
        response: `Untuk top up, yang aktif saat ini antara lain ${summary}. Kalau kamu sudah tahu game atau nominalnya, balas detailnya saja dan aku bantu arahkan langkah ordernya.`,
      })
    }

    if (intent === 'food') {
      const items = await db.foodItem.findMany({
        where: searchContext.searchTerms.length > 0
          ? {
              active: true,
              OR: searchContext.searchTerms.flatMap((term) => ([
                { name: { contains: term, mode: 'insensitive' } },
                { subtitle: { contains: term, mode: 'insensitive' } },
                { items: { contains: term, mode: 'insensitive' } },
              ])),
            }
          : { active: true },
        orderBy: { order: 'asc' },
        take: 5,
        select: { name: true, subtitle: true },
      })

      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'food',
      })

      if (items.length === 0) {
        return NextResponse.json({
          response: 'Saat ini belum ada menu food & drink yang cocok dengan permintaan itu. Kalau mau, kirim jenis menu yang dicari atau range budgetnya.',
        })
      }

      return NextResponse.json({
        response: `Menu food & drink yang aktif sekarang: ${items.map((item) => item.subtitle ? `${item.name} (${item.subtitle})` : item.name).join(', ')}. Kalau kamu mau, aku bisa bantu pilihkan yang paling cocok buat kebutuhanmu.`,
      })
    }

    if (intent === 'travel') {
      const [services, destinations] = await Promise.all([
        db.travelService.findMany({
          where: searchContext.searchTerms.length > 0
            ? {
                active: true,
                OR: searchContext.searchTerms.flatMap((term) => ([
                  { name: { contains: term, mode: 'insensitive' } },
                  { subtitle: { contains: term, mode: 'insensitive' } },
                  { desc: { contains: term, mode: 'insensitive' } },
                ])),
              }
            : { active: true },
          orderBy: { order: 'asc' },
          take: 4,
          select: { name: true, subtitle: true },
        }),
        db.popularDestination.findMany({
          where: searchContext.searchTerms.length > 0
            ? {
                active: true,
                OR: searchContext.searchTerms.flatMap((term) => ([
                  { name: { contains: term, mode: 'insensitive' } },
                  { subtitle: { contains: term, mode: 'insensitive' } },
                ])),
              }
            : { active: true },
          orderBy: { order: 'asc' },
          take: 4,
          select: { name: true, subtitle: true },
        }),
      ])

      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'travel',
      })

      const parts: string[] = []
      if (services.length > 0) {
        parts.push(`layanan travel: ${services.map((item) => item.subtitle ? `${item.name} (${item.subtitle})` : item.name).join(', ')}`)
      }
      if (destinations.length > 0) {
        parts.push(`destinasi populer: ${destinations.map((item) => item.subtitle ? `${item.name} (${item.subtitle})` : item.name).join(', ')}`)
      }

      return NextResponse.json({
        response: parts.length > 0
          ? `Untuk travel, yang tersedia saat ini ada ${parts.join(' | ')}. Kalau kamu punya tujuan, tanggal, atau tipe trip tertentu, kirim detailnya dan aku bantu persempit pilihannya.`
          : 'Saat ini belum ada layanan travel atau destinasi aktif yang cocok dengan permintaan itu.',
      })
    }

    if (intent === 'product_list') {
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
          description: true,
          featured: true,
          rating: true,
        },
      })

      saveSession(sessionId, {
        lastIntent: intent,
        lastDomain: 'product',
      })

      if (featuredProducts.length === 0) {
        return NextResponse.json({
          response: 'Saat ini belum ada produk yang tampil di katalog store. Nanti kalau produk sudah tersedia, aku bisa bantu sortir berdasarkan kategori atau budget.',
        })
      }

      return NextResponse.json({
        response: `Produk yang sedang tampil saat ini antara lain:\n${featuredProducts.map(buildProductSummaryLine).join('\n')}\n\nKalau mau hasil yang lebih kepake, bilang saja kategori, nama produk, atau budgetmu.`,
      })
    }

    if (intent === 'product_search' || intent === 'product_recommendation') {
      return handleProductIntent(searchContext, sessionId, settings?.name)
    }

    saveSession(sessionId, {
      lastIntent: 'fallback',
      lastDomain: session?.lastDomain ?? 'general',
    })

    return NextResponse.json({
      response: `${friendlyIntro(settings?.name)} Supaya aku jawab lebih pas, langsung bilang kebutuhanmu ya. Contoh: "rekomendasi produk budget 1 juta", "info checkout", "layanan top up aktif", atau "promo referral".`,
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

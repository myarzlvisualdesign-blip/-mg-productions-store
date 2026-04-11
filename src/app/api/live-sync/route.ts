import { db } from '@/lib/db'
import { publicJson } from '@/lib/public-api'

type AggregateResult = {
  _count: {
    _all: number
  }
  _max: {
    updatedAt: Date | null
  }
}

function toSignature(result: AggregateResult) {
  return `${result._count._all}:${result._max.updatedAt?.toISOString() ?? ''}`
}

export async function GET() {
  try {
    const [
      products,
      categories,
      partners,
      topup,
      food,
      travel,
      destinations,
      topupBanners,
      chatbotSettings,
      referralSettings,
    ] = await Promise.all([
      db.product.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.category.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.partner.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.topUpService.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.foodItem.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.travelService.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.popularDestination.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.topUpBanner.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.chatbotSettings.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
      db.referralSettings.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
    ])

    return publicJson({
      generatedAt: new Date().toISOString(),
      topics: {
        products: toSignature(products),
        categories: toSignature(categories),
        partners: toSignature(partners),
        topup: toSignature(topup),
        food: toSignature(food),
        travel: toSignature(travel),
        destinations: toSignature(destinations),
        'topup-banners': toSignature(topupBanners),
        'chatbot-settings': toSignature(chatbotSettings),
        'referral-settings': toSignature(referralSettings),
      },
    })
  } catch {
    return publicJson(
      { error: 'Failed to read live sync snapshot' },
      { status: 500 }
    )
  }
}

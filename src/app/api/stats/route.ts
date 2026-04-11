import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getCanonicalChatbotSettings } from '@/lib/chatbot-settings'
import { getCanonicalReferralSettings } from '@/lib/referral-settings'

type StatsSummaryRow = {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  deliveredOrders: number
  uniqueCustomers: number
  lowStockProducts: number
  totalStock: number
  totalPartners: number
  activePartners: number
  totalTopUpServices: number
  activeTopUpServices: number
  totalTopUpBanners: number
  activeTopUpBanners: number
  totalFoodItems: number
  activeFoodItems: number
  totalTravelServices: number
  activeTravelServices: number
  totalDestinations: number
  activeDestinations: number
  totalReferralCodes: number
  pendingWithdrawals: number
}

// ADMIN ONLY — Statistik dashboard
export async function GET(request: NextRequest) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const [summaryRows, categoryRows, referralSettings, chatbotSettings] = await Promise.all([
      db.$queryRaw<StatsSummaryRow[]>(Prisma.sql`
        SELECT
          CAST((SELECT COUNT(*) FROM "Product") AS INTEGER) AS "totalProducts",
          CAST((SELECT COUNT(*) FROM "Order") AS INTEGER) AS "totalOrders",
          COALESCE((SELECT SUM(total) FROM "Order" WHERE status <> 'cancelled'), 0) AS "totalRevenue",
          CAST((SELECT COUNT(*) FROM "Order" WHERE status = 'pending') AS INTEGER) AS "pendingOrders",
          CAST((SELECT COUNT(*) FROM "Order" WHERE status = 'delivered') AS INTEGER) AS "deliveredOrders",
          CAST((SELECT COUNT(DISTINCT "customerEmail") FROM "Order") AS INTEGER) AS "uniqueCustomers",
          CAST((SELECT COUNT(*) FROM "Product" WHERE stock < 20) AS INTEGER) AS "lowStockProducts",
          CAST(COALESCE((SELECT SUM(stock) FROM "Product"), 0) AS INTEGER) AS "totalStock",
          CAST((SELECT COUNT(*) FROM "Partner") AS INTEGER) AS "totalPartners",
          CAST((SELECT COUNT(*) FROM "Partner" WHERE active = 1) AS INTEGER) AS "activePartners",
          CAST((SELECT COUNT(*) FROM "TopUpService") AS INTEGER) AS "totalTopUpServices",
          CAST((SELECT COUNT(*) FROM "TopUpService" WHERE active = 1) AS INTEGER) AS "activeTopUpServices",
          CAST((SELECT COUNT(*) FROM "TopUpBanner") AS INTEGER) AS "totalTopUpBanners",
          CAST((SELECT COUNT(*) FROM "TopUpBanner" WHERE active = 1) AS INTEGER) AS "activeTopUpBanners",
          CAST((SELECT COUNT(*) FROM "FoodItem") AS INTEGER) AS "totalFoodItems",
          CAST((SELECT COUNT(*) FROM "FoodItem" WHERE active = 1) AS INTEGER) AS "activeFoodItems",
          CAST((SELECT COUNT(*) FROM "TravelService") AS INTEGER) AS "totalTravelServices",
          CAST((SELECT COUNT(*) FROM "TravelService" WHERE active = 1) AS INTEGER) AS "activeTravelServices",
          CAST((SELECT COUNT(*) FROM "PopularDestination") AS INTEGER) AS "totalDestinations",
          CAST((SELECT COUNT(*) FROM "PopularDestination" WHERE active = 1) AS INTEGER) AS "activeDestinations",
          CAST((SELECT COUNT(*) FROM "ReferralCode") AS INTEGER) AS "totalReferralCodes",
          CAST((SELECT COUNT(*) FROM "ReferralWithdrawal" WHERE status = 'pending') AS INTEGER) AS "pendingWithdrawals"
      `),
      db.$queryRaw<Array<{ category: string; count: number }>>(Prisma.sql`
        SELECT
          category,
          CAST(COUNT(*) AS INTEGER) AS count
        FROM "Product"
        GROUP BY category
      `),
      getCanonicalReferralSettings(),
      getCanonicalChatbotSettings(),
    ])

    const summary = summaryRows[0]

    const categoryCount = categoryRows.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = item.count
      return acc
    }, {})

    return NextResponse.json({
      totalProducts: summary.totalProducts,
      totalOrders: summary.totalOrders,
      totalRevenue: Math.round(summary.totalRevenue * 100) / 100,
      pendingOrders: summary.pendingOrders,
      deliveredOrders: summary.deliveredOrders,
      uniqueCustomers: summary.uniqueCustomers,
      lowStockProducts: summary.lowStockProducts,
      totalStock: summary.totalStock,
      categoryCount,
      totalPartners: summary.totalPartners,
      activePartners: summary.activePartners,
      totalTopUpServices: summary.totalTopUpServices,
      activeTopUpServices: summary.activeTopUpServices,
      totalTopUpBanners: summary.totalTopUpBanners,
      activeTopUpBanners: summary.activeTopUpBanners,
      totalFoodItems: summary.totalFoodItems,
      activeFoodItems: summary.activeFoodItems,
      totalTravelServices: summary.totalTravelServices,
      activeTravelServices: summary.activeTravelServices,
      totalDestinations: summary.totalDestinations,
      activeDestinations: summary.activeDestinations,
      totalReferralCodes: summary.totalReferralCodes,
      pendingWithdrawals: summary.pendingWithdrawals,
      referralEnabled: referralSettings.enabled,
      chatbotEnabled: chatbotSettings.enabled,
    })
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}

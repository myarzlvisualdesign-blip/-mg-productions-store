import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

function getActiveCounts(grouped: Array<{ active: boolean; _count: { _all: number } }>) {
  const total = grouped.reduce((sum, item) => sum + item._count._all, 0)
  const active = grouped.find((item) => item.active)?._count._all ?? 0

  return { total, active }
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
    // Keep queries lightweight for serverless runtimes and Supabase pooler limits.
    const orderStatusGroups = await db.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const uniqueCustomerGroups = await db.order.groupBy({
      by: ['customerEmail'],
    })
    const revenueAggregate = await db.order.aggregate({
      where: { status: { not: 'cancelled' } },
      _sum: { total: true },
    })
    const lowStockProducts = await db.product.count({
      where: { stock: { lt: 20 } },
    })
    const stockAggregate = await db.product.aggregate({
      _sum: { stock: true },
    })
    const categoryGroups = await db.product.groupBy({
      by: ['category'],
      _count: { _all: true },
    })
    const partnerGroups = await db.partner.groupBy({
      by: ['active'],
      _count: { _all: true },
    })
    const topUpServiceGroups = await db.topUpService.groupBy({
      by: ['active'],
      _count: { _all: true },
    })
    const topUpBannerGroups = await db.topUpBanner.groupBy({
      by: ['active'],
      _count: { _all: true },
    })
    const foodItemGroups = await db.foodItem.groupBy({
      by: ['active'],
      _count: { _all: true },
    })
    const travelServiceGroups = await db.travelService.groupBy({
      by: ['active'],
      _count: { _all: true },
    })
    const destinationGroups = await db.popularDestination.groupBy({
      by: ['active'],
      _count: { _all: true },
    })
    const referralCodes = await db.referralCode.count()
    const pendingWithdrawals = await db.referralWithdrawal.count({
      where: { status: 'pending' },
    })
    const referralSettings = await db.referralSettings.findFirst({
      select: { enabled: true },
    })
    const chatbotSettings = await db.chatbotSettings.findFirst({
      select: { enabled: true },
    })

    const totalRevenue = revenueAggregate._sum.total ?? 0
    const totalStock = stockAggregate._sum.stock ?? 0

    const categoryCount = categoryGroups.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = item._count._all
      return acc
    }, {})

    const totalProducts = categoryGroups.reduce((sum, item) => sum + item._count._all, 0)

    const ordersByStatus = orderStatusGroups.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count._all
      return acc
    }, {})

    const totalOrders = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0)
    const pendingOrders = ordersByStatus.pending ?? 0
    const deliveredOrders = ordersByStatus.delivered ?? 0
    const uniqueCustomers = uniqueCustomerGroups.length

    const partners = getActiveCounts(partnerGroups)
    const topUpServices = getActiveCounts(topUpServiceGroups)
    const topUpBanners = getActiveCounts(topUpBannerGroups)
    const foodItems = getActiveCounts(foodItemGroups)
    const travelServices = getActiveCounts(travelServiceGroups)
    const destinations = getActiveCounts(destinationGroups)

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrders,
      deliveredOrders,
      uniqueCustomers,
      lowStockProducts,
      totalStock,
      categoryCount,
      totalPartners: partners.total,
      activePartners: partners.active,
      totalTopUpServices: topUpServices.total,
      activeTopUpServices: topUpServices.active,
      totalTopUpBanners: topUpBanners.total,
      activeTopUpBanners: topUpBanners.active,
      totalFoodItems: foodItems.total,
      activeFoodItems: foodItems.active,
      totalTravelServices: travelServices.total,
      activeTravelServices: travelServices.active,
      totalDestinations: destinations.total,
      activeDestinations: destinations.active,
      totalReferralCodes: referralCodes,
      pendingWithdrawals,
      referralEnabled: referralSettings?.enabled ?? false,
      chatbotEnabled: chatbotSettings?.enabled ?? false,
    })
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}

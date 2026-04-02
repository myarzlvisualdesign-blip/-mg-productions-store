import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

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
    const [
      totalProducts,
      totalOrders,
      orders,
      products,
      partners,
      topUpServices,
      topUpBanners,
      foodItems,
      travelServices,
      destinations,
      referralCodes,
      pendingWithdrawals,
      referralSettings,
      chatbotSettings,
    ] = await Promise.all([
      db.product.count(),
      db.order.count(),
      db.order.findMany(),
      db.product.findMany(),
      db.partner.findMany({ select: { active: true } }),
      db.topUpService.findMany({ select: { active: true } }),
      db.topUpBanner.findMany({ select: { active: true } }),
      db.foodItem.findMany({ select: { active: true } }),
      db.travelService.findMany({ select: { active: true } }),
      db.popularDestination.findMany({ select: { active: true } }),
      db.referralCode.count(),
      db.referralWithdrawal.count({ where: { status: 'pending' } }),
      db.referralSettings.findFirst({ select: { enabled: true } }),
      db.chatbotSettings.findFirst({ select: { enabled: true } }),
    ])

    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0)

    const pendingOrders = orders.filter((o) => o.status === 'pending').length
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length
    const lowStockProducts = products.filter((p) => p.stock < 20).length
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0)

    const categoryCount: Record<string, number> = {}
    products.forEach((p) => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
    })

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrders,
      deliveredOrders,
      lowStockProducts,
      totalStock,
      categoryCount,
      totalPartners: partners.length,
      activePartners: partners.filter((item) => item.active).length,
      totalTopUpServices: topUpServices.length,
      activeTopUpServices: topUpServices.filter((item) => item.active).length,
      totalTopUpBanners: topUpBanners.length,
      activeTopUpBanners: topUpBanners.filter((item) => item.active).length,
      totalFoodItems: foodItems.length,
      activeFoodItems: foodItems.filter((item) => item.active).length,
      totalTravelServices: travelServices.length,
      activeTravelServices: travelServices.filter((item) => item.active).length,
      totalDestinations: destinations.length,
      activeDestinations: destinations.filter((item) => item.active).length,
      totalReferralCodes: referralCodes,
      pendingWithdrawals,
      referralEnabled: referralSettings?.enabled ?? false,
      chatbotEnabled: chatbotSettings?.enabled ?? false,
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}

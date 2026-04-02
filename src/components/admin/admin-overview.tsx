'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { useViewStore } from '@/store/view-store'
import StatsCards from './stats-cards'
import { formatRupiah } from '@/lib/utils'
import { adminFetchJson } from '@/lib/admin-fetch'

interface StatsData {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  deliveredOrders: number
  lowStockProducts: number
  totalStock: number
  categoryCount: Record<string, number>
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
  referralEnabled: boolean
  chatbotEnabled: boolean
}

interface Order {
  id: string
  items: string
  total: number
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

const PURPLE_PALETTE = [
  'rgba(168, 85, 247, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(124, 58, 237, 0.8)',
  'rgba(109, 40, 217, 0.8)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(79, 70, 229, 0.8)',
  'rgba(67, 56, 202, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(219, 39, 119, 0.8)',
  'rgba(168, 85, 247, 0.6)',
]

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  shipped: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const statusDotColors: Record<string, string> = {
  pending: 'bg-amber-400',
  processing: 'bg-blue-400',
  shipped: 'bg-purple-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

// Custom tooltip component for dark theme
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass-card rounded-lg border border-white/[0.1] px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-foreground" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
}

const contentCards: Array<{
  key: string
  title: string
  totalKey:
    | 'totalPartners'
    | 'totalTopUpServices'
    | 'totalTopUpBanners'
    | 'totalFoodItems'
    | 'totalTravelServices'
    | 'totalDestinations'
    | 'totalReferralCodes'
  activeKey?:
    | 'activePartners'
    | 'activeTopUpServices'
    | 'activeTopUpBanners'
    | 'activeFoodItems'
    | 'activeTravelServices'
    | 'activeDestinations'
  tab:
    | 'partners'
    | 'topup'
    | 'topup-banners'
    | 'food'
    | 'travel'
    | 'destinations'
    | 'referral'
  emoji: string
}> = [
  { key: 'partners', title: 'Mitra', totalKey: 'totalPartners', activeKey: 'activePartners', tab: 'partners', emoji: '🤝' },
  { key: 'topup', title: 'Top Up', totalKey: 'totalTopUpServices', activeKey: 'activeTopUpServices', tab: 'topup', emoji: '🎮' },
  { key: 'topup-banners', title: 'Banner', totalKey: 'totalTopUpBanners', activeKey: 'activeTopUpBanners', tab: 'topup-banners', emoji: '🖼️' },
  { key: 'food', title: 'Food', totalKey: 'totalFoodItems', activeKey: 'activeFoodItems', tab: 'food', emoji: '🍜' },
  { key: 'travel', title: 'Travel', totalKey: 'totalTravelServices', activeKey: 'activeTravelServices', tab: 'travel', emoji: '✈️' },
  { key: 'destinations', title: 'Destinasi', totalKey: 'totalDestinations', activeKey: 'activeDestinations', tab: 'destinations', emoji: '📍' },
  { key: 'referral', title: 'Referral', totalKey: 'totalReferralCodes', tab: 'referral', emoji: '🎁' },
]

export default function AdminOverview() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { setAdminTab } = useViewStore()

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, ordersData] = await Promise.all([
          adminFetchJson<StatsData>('/api/stats'),
          adminFetchJson<Order[]>('/api/orders'),
        ])
        setStats(statsData)
        setOrders(ordersData)
      } catch (err) {
        console.error('Failed to fetch overview data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Prepare orders-by-status data for bar chart
  const ordersByStatus = (() => {
    if (!stats) return []
    return [
      { name: 'Pending', value: stats.pendingOrders, fill: 'rgba(245, 158, 11, 0.7)' },
      { name: 'Delivered', value: stats.deliveredOrders, fill: 'rgba(16, 185, 129, 0.7)' },
      {
        name: 'Processing',
        value: stats.totalOrders - stats.pendingOrders - stats.deliveredOrders,
        fill: 'rgba(139, 92, 246, 0.7)',
      },
    ]
  })()

  // Prepare category distribution data for pie chart
  const categoryData = (() => {
    if (!stats) return []
    return Object.entries(stats.categoryCount).map(([name, value]) => ({
      name,
      value,
    }))
  })()

  // Recent 5 orders for mini-table
  const recentOrders = orders.slice(0, 5)

  const moduleCards = stats
    ? contentCards.map((card) => {
        const total = stats[card.totalKey] as number
        const active = card.activeKey ? (stats[card.activeKey] as number) : null
        const subtitle = card.key === 'referral'
          ? `${stats.referralEnabled ? 'aktif' : 'nonaktif'} • ${stats.pendingWithdrawals} pending withdrawal`
          : `${active ?? 0} aktif dari ${total}`
        return {
          ...card,
          total,
          subtitle,
        }
      })
    : []

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl glass-card animate-pulse" />
          <div className="h-80 rounded-2xl glass-card animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="show">
        <StatsCards />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart - Orders by Status */}
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-base font-semibold text-foreground mb-4">Orders by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByStatus} barSize={40}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Orders" radius={[6, 6, 0, 0]}>
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart - Category Distribution */}
        <motion.div
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-base font-semibold text-foreground mb-4">Category Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PURPLE_PALETTE[index % PURPLE_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null
                      const data = payload[0]
                      return (
                        <div className="glass-card rounded-lg border border-white/[0.1] px-3 py-2 shadow-xl">
                          <p className="text-sm font-semibold text-foreground">{data.name}</p>
                          <p className="text-xs text-muted-foreground">{data.value} products</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No category data available</p>
            )}
          </div>
          {/* Legend */}
          {categoryData.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PURPLE_PALETTE[index % PURPLE_PALETTE.length] }}
                  />
                  <span className="text-[11px] text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Orders Mini Table */}
      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Market Content Sync</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Semua modul storefront yang harus sinkron dengan panel admin
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={stats.chatbotEnabled ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-muted-foreground border-white/10'}>
              Chatbot {stats.chatbotEnabled ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <Badge className={stats.referralEnabled ? 'bg-purple-500/15 text-purple-300 border-purple-500/20' : 'bg-white/5 text-muted-foreground border-white/10'}>
              Referral {stats.referralEnabled ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {moduleCards.map((card) => (
            <button
              key={card.key}
              onClick={() => setAdminTab(card.tab)}
              className="text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-purple-500/20 transition-all p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{card.emoji}</span>
                <span className="text-[10px] text-purple-400 font-medium">Buka</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{card.title}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{card.total}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{card.subtitle}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Orders Mini Table */}
      <motion.div
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Recent Orders</h3>
          <button
            onClick={() => setAdminTab('orders')}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                  Total
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No recent orders
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold text-foreground">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant="outline"
                        className={`${statusColors[order.status] || ''} border text-[11px] px-2 py-0.5 font-medium`}
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusDotColors[order.status] || ''}`}
                        />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

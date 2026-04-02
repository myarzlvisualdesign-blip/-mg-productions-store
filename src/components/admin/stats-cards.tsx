'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, ShoppingCart, Package, Users } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { useViewStore } from '@/store/view-store'
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
}

interface OrdersData {
  customerEmail: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function StatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [orders, setOrders] = useState<OrdersData[]>([])
  const [loading, setLoading] = useState(true)
  const { setAdminTab } = useViewStore()

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, ordersData] = await Promise.all([
          adminFetchJson<StatsData>('/api/stats'),
          adminFetchJson<OrdersData[]>('/api/orders'),
        ])
        setStats(statsData)
        setOrders(ordersData)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const uniqueCustomers = new Set(orders.map((o) => o.customerEmail)).size

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl glass-card animate-pulse" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: formatRupiah(stats.totalRevenue),
      subtitle: '+12.5% dari bulan lalu',
      icon: Banknote,
      accent: 'from-emerald-500/20 to-emerald-600/10',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      borderHover: 'hover:border-emerald-500/30',
      viewTab: null as string | null,
    },
    {
      title: 'Total Orders',
      value: `${stats.totalOrders} orders`,
      subtitle: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      accent: 'from-purple-500/20 to-purple-600/10',
      iconBg: 'bg-purple-500/20 text-purple-400',
      borderHover: 'hover:border-purple-500/30',
      viewTab: 'orders' as string | null,
    },
    {
      title: 'Total Products',
      value: `${stats.totalProducts} products`,
      subtitle: `${stats.lowStockProducts} low stock`,
      icon: Package,
      accent: 'from-blue-500/20 to-blue-600/10',
      iconBg: 'bg-blue-500/20 text-blue-400',
      borderHover: 'hover:border-blue-500/30',
      viewTab: 'inventory' as string | null,
      warning: stats.lowStockProducts > 0,
    },
    {
      title: 'Customers',
      value: `${uniqueCustomers} total`,
      subtitle: 'unique email addresses',
      icon: Users,
      accent: 'from-pink-500/20 to-pink-600/10',
      iconBg: 'bg-pink-500/20 text-pink-400',
      borderHover: 'hover:border-pink-500/30',
      viewTab: null as string | null,
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            variants={item}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative overflow-hidden rounded-2xl glass-card border border-white/[0.06] p-5 ${card.borderHover} transition-colors duration-300`}
          >
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-50`} />

            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
              </div>

              <div className="flex items-center justify-between">
                <p
                  className={`text-xs ${
                    card.warning ? 'text-amber-400' : 'text-muted-foreground'
                  }`}
                >
                  {card.subtitle}
                </p>
                {card.viewTab && (
                  <button
                    onClick={() => setAdminTab(card.viewTab as 'orders' | 'inventory')}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

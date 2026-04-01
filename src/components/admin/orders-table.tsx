'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useViewStore } from '@/store/view-store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

type FilterStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const statusFilters: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
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

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)
  const { setAdminTab } = useViewStore()

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Order marked as ${newStatus}`)
        fetchOrders()
      } else {
        toast.error('Failed to update order status')
      }
    } catch {
      toast.error('Failed to update order status')
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const parseItemsCount = (itemsStr: string): number => {
    try {
      const items = JSON.parse(itemsStr)
      return Array.isArray(items) ? items.length : 1
    } catch {
      return 1
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    show: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.03, duration: 0.3 },
    }),
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Filter badges */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((sf) => (
            <button
              key={sf.value}
              onClick={() => setFilter(sf.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                filter === sf.value
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'
              }`}
            >
              {sf.label}
              {sf.value !== 'all' && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {orders.filter((o) => o.status === sf.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-white/[0.02]">
              <TableHead className="text-muted-foreground font-medium">Order ID</TableHead>
              <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
              <TableHead className="text-muted-foreground font-medium">Items</TableHead>
              <TableHead className="text-muted-foreground font-medium">Total</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    className="border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {parseItemsCount(order.items)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-foreground">
                      {formatRupiah(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColors[order.status] || ''} border text-[11px] px-2 py-0.5 font-medium`}
                      >
                        <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusDotColors[order.status] || ''}`} />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-popover border-white/[0.06]"
                        >
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, 'processing')}
                            className="text-sm cursor-pointer focus:bg-white/5"
                          >
                            Mark as Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, 'shipped')}
                            className="text-sm cursor-pointer focus:bg-white/5"
                          >
                            Mark as Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            className="text-sm cursor-pointer focus:bg-white/5"
                          >
                            Mark as Delivered
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/[0.06]" />
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            className="text-sm text-red-400 cursor-pointer focus:bg-red-500/10 focus:text-red-400"
                          >
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

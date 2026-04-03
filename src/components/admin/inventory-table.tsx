'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, PlusCircle, RefreshCw, Pencil, Trash2, ImageIcon, ExternalLink, Link as LinkIcon } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { formatRupiah } from '@/lib/utils'
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch'
import { broadcastLiveSync } from '@/lib/live-sync'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  link?: string
  stock: number
  featured: boolean
  rating: number
  createdAt: string
  updatedAt: string
}

interface InventoryTableProps {
  onEditProduct?: (product: Product) => void
  refreshKey?: number
}

function getStockStatus(stock: number): { label: string; className: string } {
  if (stock === 0) {
    return {
      label: 'Out of Stock',
      className: 'bg-red-500/15 text-red-400 border-red-500/30',
    }
  }
  if (stock < 20) {
    return {
      label: 'Low Stock',
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    }
  }
  return {
    label: 'In Stock',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }
}

export default function InventoryTable({ onEditProduct, refreshKey }: InventoryTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { setAdminTab } = useViewStore()

  const fetchProducts = useCallback(async () => {
    try {
      const data = await adminFetchJson<Product[]>('/api/products')
      setProducts(data)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts, refreshKey])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await adminFetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        broadcastLiveSync('products')
        toast.success('Product deleted successfully')
        fetchProducts()
      } else {
        toast.error('Failed to delete product')
      }
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

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
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground">Product Inventory</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-48 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchProducts}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => setAdminTab('products')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm h-9 gap-2 shadow-lg shadow-purple-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-white/[0.02]">
                <TableHead className="text-muted-foreground font-medium">Product</TableHead>
                <TableHead className="text-muted-foreground font-medium">Category</TableHead>
                <TableHead className="text-muted-foreground font-medium">Price</TableHead>
                <TableHead className="text-muted-foreground font-medium">Stock</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product, i) => {
                    const stockStatus = getStockStatus(product.stock)
                    return (
                      <motion.tr
                        key={product.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                        className="border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const parent = target.parentElement
                                    if (parent) {
                                      const fallback = document.createElement('div')
                                      fallback.className = 'flex items-center justify-center h-full w-full bg-purple-500/10'
                                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-400/50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                                      parent.appendChild(fallback)
                                    }
                                  }}
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-purple-400/40" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.featured && (
                                  <span className="text-[10px] text-purple-400 font-medium">
                                    ★ Featured
                                  </span>
                                )}
                                {product.link && (
                                  <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-0.5 text-[10px] text-blue-400/80 hover:text-blue-300 transition-colors"
                                  >
                                    <LinkIcon className="h-2.5 w-2.5" />
                                    <span className="truncate max-w-[120px]">{product.link}</span>
                                    <ExternalLink className="h-2 w-2 shrink-0" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {product.category}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-foreground">
                          {formatRupiah(product.price)}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{product.stock}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${stockStatus.className} border text-[11px] px-2 py-0.5 font-medium`}
                          >
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={() => onEditProduct?.(product)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => setDeleteTarget(product)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-xs text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card border-white/[0.06] bg-popover max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="text-muted-foreground hover:text-foreground border-white/[0.06]"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

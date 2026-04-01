'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Sparkles, ShoppingCart, AlertTriangle, ImageIcon, ExternalLink, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  link?: string
  stock: number
  rating: number
  featured: boolean
}

interface ProductCardProps {
  product: Product
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3 ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const isLowStock = product.stock > 0 && product.stock < 20
  const hasLink = !!product.link

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
    toast.success(`${product.name} ditambahkan ke keranjang`, {
      description: formatRupiah(product.price),
    })
    setShowActions(false)
    openCart()
  }

  const handleVisitLink = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    window.open(product.link, '_blank', 'noopener,noreferrer')
    setShowActions(false)
  }

  const handleToggleActions = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActions((prev) => !prev)
  }

  const handleCloseOverlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActions(false)
  }

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="group glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/10 hover:shadow-lg hover:shadow-purple-500/5 flex flex-col h-full"
    >
      {/* Image Area */}
      <div
        className="relative aspect-square overflow-hidden cursor-pointer flex-shrink-0"
        onClick={handleToggleActions}
      >
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="size-full flex items-center justify-center bg-muted/20 text-muted-foreground">
            <ImageIcon className="size-8 opacity-30" />
          </div>
        )}

        {/* Featured Badge */}
        {product.featured && (
          <Badge className="absolute top-2 left-2 gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[8px] px-1.5 py-0.5 leading-none z-10 shadow-sm">
            <Sparkles className="size-2.5" />
            Featured
          </Badge>
        )}

        {/* Low Stock Badge */}
        {isLowStock && (
          <Badge className="absolute top-2 right-2 gap-0.5 bg-red-500/90 text-white border-0 text-[8px] px-1.5 py-0.5 leading-none z-10 shadow-sm">
            <AlertTriangle className="size-2.5" />
            Low Stock
          </Badge>
        )}

        {/* Hover hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <ShoppingCart className="size-2.5 text-white" />
            <ExternalLink className="size-2.5 text-white" />
          </div>
        </div>

        {/* ─── Action Overlay ─────────────────────────────── */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-between bg-black/65 backdrop-blur-[6px] py-5 px-3"
              onClick={handleCloseOverlay}
            >
              {/* Top: Product Name + Close */}
              <div className="w-full flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-lg line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/50 mt-0.5 line-clamp-1">
                    {product.category}
                  </p>
                </div>
                <button
                  onClick={handleCloseOverlay}
                  className="shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>

              {/* Bottom: Price + Buttons */}
              <div className="w-full space-y-3 mt-auto">
                {/* Price */}
                <p className="text-sm sm:text-base font-extrabold text-white text-center drop-shadow">
                  {formatRupiah(product.price)}
                </p>

                {/* Action Button — only one based on link availability */}
                {hasLink ? (
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.05 }}
                    onClick={handleVisitLink}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl bg-blue-500/90 hover:bg-blue-400 text-white text-[11px] sm:text-xs font-bold shadow-lg shadow-blue-500/30 transition-colors active:scale-[0.96]"
                  >
                    <ExternalLink className="size-3.5 sm:size-4" />
                    <span>Visit</span>
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.05 }}
                    onClick={() => handleAddToCart()}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-[11px] sm:text-xs font-bold shadow-lg shadow-purple-500/30 transition-colors active:scale-[0.96]"
                  >
                    <ShoppingCart className="size-3.5 sm:size-4" />
                    <span>Order</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content — pushed to bottom */}
      <div className="p-2.5 sm:p-3 mt-auto">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mb-1 truncate">
          {product.category}
        </p>
        <h3 className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] sm:text-xs font-extrabold gradient-text leading-tight">
            {formatRupiah(product.price)}
          </span>
          <StarRating rating={product.rating} />
        </div>
      </div>
    </motion.div>
  )
}

export type { Product }

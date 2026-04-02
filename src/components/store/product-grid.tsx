'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, PackageOpen, ChevronDown, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import CategoryFilter from './category-filter'
import ProductCard, { type Product } from './product-card'
import { fetchJsonWithRetry } from '@/lib/client-fetch'

const ITEMS_PER_PAGE = 16

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-2.5 sm:p-3 space-y-1.5">
        <Skeleton className="h-2 w-10" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      </div>
    </div>
  )
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const visibleProducts = products.slice(0, visibleCount)
  const hasMore = visibleCount < products.length

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [selectedCategory, searchQuery])

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'All') params.set('category', selectedCategory)
        if (searchQuery) params.set('search', searchQuery)
        const data = await fetchJsonWithRetry<Product[]>(
          `/api/products?${params.toString()}`
        )
        if (Array.isArray(data)) {
          setProducts(data)
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [selectedCategory, searchQuery])

  // Intersection Observer — auto load more when scrolling to bottom
  useEffect(() => {
    if (!hasMore || loadingMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, visibleCount])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    // Small delay for smooth UX
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, products.length))
      setLoadingMore(false)
    }, 400)
  }, [loadingMore, hasMore, products.length])

  // Listen for search events from header
  useEffect(() => {
    const handler = (e: Event) => {
      const query = (e as CustomEvent).detail as string
      if (query) {
        setSearchQuery(query)
      }
    }
    window.addEventListener('store-search', handler)
    return () => window.removeEventListener('store-search', handler)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  return (
    <section id="products" className="py-8 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold">
            Our <span className="gradient-text">Products</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Browse our carefully curated collection of premium products
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 h-11 border-white/10 bg-white/5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-5">
          <CategoryFilter selectedCategory={selectedCategory} onSelect={handleCategoryChange} />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
              <PackageOpen className="size-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Products Found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : `No products available in "${selectedCategory}" yet. Check back soon!`}
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
                className="px-5 py-2 text-sm font-medium rounded-lg text-purple-300 glass-card border border-purple-500/30 hover:border-purple-500/50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              key={`${selectedCategory}-${searchQuery}`}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4 items-stretch"
            >
              {visibleProducts.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </motion.div>

            {/* Show More / Load More Section */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="group flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-purple-300 hover:text-purple-200 glass-card border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5 rounded-xl transition-all duration-200"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Memuat...</span>
                    </>
                  ) : (
                    <>
                      <span>Tampilkan Lebih Banyak</span>
                      <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Menampilkan {visibleProducts.length} dari {products.length} produk
                </p>
              </div>
            )}

            {/* All loaded indicator */}
            {!hasMore && products.length > ITEMS_PER_PAGE && (
              <div className="mt-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Semua {products.length} produk telah ditampilkan
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

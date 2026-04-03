'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Search, Menu, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/store/cart-store'
import { useViewStore } from '@/store/view-store'
import { fetchJsonWithRetry } from '@/lib/client-fetch'

interface SearchSuggestion {
  id: string
  name: string
  category: string
  price: number
}

export default function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const totalItems = useCartStore((s) => s.totalItems())
  const openCart = useCartStore((s) => s.openCart)
  const toggleView = useViewStore((s) => s.toggleView)

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const query = searchQuery.trim()
      window.dispatchEvent(
        new CustomEvent('store-search', {
          detail: { query, scrollToResults: true },
        })
      )
      setSearchOpen(false)
    },
    [searchQuery]
  )

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name)
    setSuggestions([])
    setSearchOpen(false)
    window.dispatchEvent(
      new CustomEvent('store-search', {
        detail: { query: suggestion.name, scrollToResults: true },
      })
    )
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()
    const timeoutId = window.setTimeout(async () => {
      if (!query) {
        setSuggestions([])
        setSearching(false)
        window.dispatchEvent(
          new CustomEvent('store-search', {
            detail: { query: '', scrollToResults: false },
          })
        )
        return
      }

      setSearching(true)
      window.dispatchEvent(
        new CustomEvent('store-search', {
          detail: { query, scrollToResults: false },
        })
      )

      try {
        const data = await fetchJsonWithRetry<SearchSuggestion[]>(
          `/api/products?search=${encodeURIComponent(query)}&limit=5`
        )
        setSuggestions(Array.isArray(data) ? data : [])
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 180)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  const searchPanel = (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="h-11 rounded-2xl border-white/12 bg-white/6 pl-10 pr-10 text-sm placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {(searching || suggestions.length > 0) && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          {searching && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Mencari produk...
            </div>
          )}

          {!searching && suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="flex w-full items-center justify-between gap-3 border-b border-white/6 px-4 py-3 text-left last:border-b-0 hover:bg-white/6"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {suggestion.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {suggestion.category}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-purple-300">
                Rp{suggestion.price.toLocaleString('id-ID')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <header
      className={`store-header fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${scrolled || mobileMenuOpen || searchOpen ? 'scrolled' : ''}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-3 sm:h-20">
          {/* Logo */}
          <div className="min-w-0 flex items-center gap-2 select-none">
            <img
              src="/logo-sm.png"
              alt="MG PRODUCTIONS"
              className="h-8 sm:h-9 w-auto object-contain rounded-md transition-all duration-300"
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Search */}
            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleSearch}
                  className="relative hidden overflow-visible sm:flex sm:items-center"
                >
                  <div className="w-full">
                    {searchPanel}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-white/8 hover:text-foreground"
              onClick={() => {
                setSearchOpen((prev) => !prev)
                setSearchQuery('')
                setMobileMenuOpen(false)
              }}
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl text-muted-foreground hover:bg-white/8 hover:text-foreground"
              onClick={openCart}
            >
              <ShoppingBag className="size-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-purple-600 text-white text-[10px] px-1">
                  {totalItems > 99 ? '99+' : totalItems}
                </Badge>
              )}
            </Button>

            {/* Admin Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-10 w-10 rounded-xl text-muted-foreground hover:bg-white/8 hover:text-foreground sm:flex"
              onClick={toggleView}
              title="Toggle Admin Panel"
            >
              <Shield className="size-5" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-white/8 hover:text-foreground md:hidden"
              onClick={() => {
                setMobileMenuOpen((prev) => !prev)
                setSearchOpen(false)
              }}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden px-4 pb-3"
          >
            <nav className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(74,29,120,0.82),rgba(20,14,38,0.94))] p-3 shadow-2xl shadow-black/35 backdrop-blur-2xl">
              <div className="mb-3 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-purple-100/90">
                  <span className="text-base">✦</span>
                  <span>New Collection 2025</span>
                </div>
              </div>

              {/* Mobile Admin Toggle */}
              <button
                onClick={() => {
                  toggleView()
                  setMobileMenuOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-purple-50/90 transition-colors hover:bg-white/7 hover:text-white"
              >
                <Shield className="size-4" />
                Admin Panel
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && !mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-4 pb-3 sm:hidden"
          >
            <form
              onSubmit={handleSearch}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(53,24,92,0.88),rgba(18,12,34,0.95))] p-3 shadow-2xl shadow-black/35 backdrop-blur-2xl"
            >
              {searchPanel}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

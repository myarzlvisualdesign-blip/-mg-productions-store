'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Search, Menu, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/store/cart-store'
import { useViewStore } from '@/store/view-store'

export default function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  const totalItems = useCartStore((s) => s.totalItems())
  const openCart = useCartStore((s) => s.openCart)
  const toggleView = useViewStore((s) => s.toggleView)

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const el = document.querySelector('#products')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        window.dispatchEvent(new CustomEvent('store-search', { detail: searchQuery }))
      }
      setSearchOpen(false)
    },
    [searchQuery]
  )

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

  return (
    <header
      className={`store-header fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${scrolled || mobileMenuOpen ? 'scrolled' : ''}`}
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
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  onSubmit={handleSearch}
                  className="hidden sm:flex items-center overflow-hidden"
                >
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="h-9 border-white/10 bg-white/5 text-sm"
                  />
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
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="pb-3">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="h-11 rounded-2xl border-white/12 bg-white/6 text-sm placeholder:text-muted-foreground"
                />
              </form>

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
    </header>
  )
}

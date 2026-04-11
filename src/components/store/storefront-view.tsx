'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift } from 'lucide-react'

// Store Components
import StoreHeader from '@/components/shared/store-header'
import HeroSection from '@/components/store/hero-section'
import Footer from '@/components/shared/footer'
import BottomNav, { type BottomTab } from '@/components/store/bottom-nav'
import { toast } from 'sonner'
import { fetchJsonWithRetry } from '@/lib/client-fetch'
import { subscribeLiveSync } from '@/lib/live-sync'
import { useLiveRefresh } from '@/hooks/use-live-refresh'

// Dynamic imports with SSR disabled — prevents hydration mismatch from Turbopack cache staleness
const ProductGrid = dynamic(() => import('@/components/store/product-grid'), { ssr: false })
const TopUpSection = dynamic(() => import('@/components/store/topup-section'), { ssr: false })
const FoodSection = dynamic(() => import('@/components/store/food-section'), { ssr: false })
const TravelSection = dynamic(() => import('@/components/store/travel-section'), { ssr: false })
const CartDrawer = dynamic(() => import('@/components/store/cart-drawer'), { ssr: false })
const ReferralDialog = dynamic(() => import('@/components/store/referral-dialog'), { ssr: false })

// ─── Featured Products (Mitra Resmi Kami) Section ───────────────────────

interface PartnerData {
  id: string
  name: string
  description: string
  image: string
  link: string
  order: number
  active: boolean
}

function FeaturedProducts() {
  const [partners, setPartners] = useState<PartnerData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const goToNextPartner = useCallback(() => {
    setActiveIndex((prev) => (partners.length === 0 ? 0 : (prev + 1) % partners.length))
  }, [partners.length])

  const fetchPartners = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await fetchJsonWithRetry<PartnerData[]>('/api/partners')
      if (Array.isArray(data)) {
        setPartners(data)
        setActiveIndex((prev) => (data.length === 0 ? 0 : Math.min(prev, data.length - 1)))
      }
    } catch {
      console.error('Failed to fetch partners')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchPartners()
  }, [fetchPartners])

  useEffect(() => subscribeLiveSync(['partners'], () => {
    void fetchPartners({ silent: true })
  }), [fetchPartners])

  useLiveRefresh(
    useCallback(() => fetchPartners({ silent: true }), [fetchPartners]),
    { intervalMs: 20000 }
  )

  useEffect(() => {
    if (partners.length === 0) return
    const timer = setInterval(() => {
      goToNextPartner()
    }, 3200)
    return () => clearInterval(timer)
  }, [goToNextPartner, partners.length])

  if (loading) {
    return (
      <section className="py-6 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto mb-3 h-6 w-48 animate-pulse rounded-lg bg-white/5 sm:h-8 sm:w-72" />
            <div className="mx-auto h-4 w-72 max-w-full animate-pulse rounded-lg bg-white/5" />
          </div>
          <div className="mx-auto flex h-36 w-36 animate-pulse items-center justify-center rounded-full bg-white/5 sm:h-44 sm:w-44" />
          <div className="mt-6 text-center">
            <div className="mx-auto h-7 w-52 animate-pulse rounded-lg bg-white/5" />
            <div className="mx-auto mt-3 h-5 w-64 max-w-full animate-pulse rounded-lg bg-white/5" />
          </div>
        </div>
      </section>
    )
  }

  if (partners.length === 0) return null
  const currentPartner = partners[activeIndex]
  const hasLink = !!currentPartner.link
  const logoContent = (
    <>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-3xl font-bold">
          Our Official <span className="gradient-text">Partners</span>
        </h2>
        <p className="mt-1.5 text-xs sm:text-base text-muted-foreground max-w-md mx-auto">
          Trusted business partner with high quality selected products
        </p>
      </div>

      <div className="mx-auto flex justify-center py-2 sm:py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPartner.id}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-fuchsia-500 to-indigo-500 shadow-[0_0_55px_rgba(168,85,247,0.3)]" />
            <div className="absolute inset-[4px] rounded-full bg-[#0b0814]" />
            <div className="relative z-10 flex h-[calc(100%-18px)] w-[calc(100%-18px)] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white shadow-inner shadow-black/10">
              {!imgErrors[currentPartner.id] ? (
                <img
                  src={currentPartner.image}
                  alt={currentPartner.name}
                  className="h-full w-full object-cover object-center"
                  onError={() => setImgErrors((prev) => ({ ...prev, [currentPartner.id]: true }))}
                />
              ) : (
                <div className="text-center text-base font-semibold text-foreground sm:text-lg">
                  {currentPartner.name}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 min-h-[4.5rem] px-4 text-center sm:mt-7 sm:min-h-[5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPartner.id}-copy`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-2xl font-semibold text-foreground leading-tight sm:text-3xl">
              {currentPartner.name}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {currentPartner.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )

  return (
    <section id="featured" className="py-6 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {hasLink ? (
          <a
            href={currentPartner.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={currentPartner.name}
            className="block"
          >
            {logoContent}
          </a>
        ) : (
          <div aria-label={currentPartner.name}>
            {logoContent}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Storefront View ───────────────────────────────────────────────────

export default function Storefront() {
  const [activeTab, setActiveTab] = useState<BottomTab>('store')
  const [referralOpen, setReferralOpen] = useState(false)

  const handleTabChange = useCallback((tab: BottomTab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('mg-store-tab-change', {
        detail: { activeTab },
      })
    )
  }, [activeTab])

  // ─── Capture ?ref= from URL and store it ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    if (refCode && refCode.startsWith('MG-')) {
      // Don't overwrite if user already has their own code as referrer
      const myCode = localStorage.getItem('mg-referral-code')
      if (myCode !== refCode) {
        localStorage.setItem('mg-referral-invite', refCode)
        toast.success(`Kode referral ${refCode} tersimpan! Diskon otomatis diterapkan saat checkout.`, {
          duration: 5000,
        })
      }
      // Clean URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('ref')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [])

  return (
    <div className="min-h-svh w-full max-w-full overflow-x-hidden">
      <StoreHeader />
      <main className="storefront-main">
        <AnimatePresence mode="wait">
          {activeTab === 'store' && (
            <motion.div key="tab-store" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <HeroSection />
              <FeaturedProducts />
              <ProductGrid />
            </motion.div>
          )}
          {activeTab === 'topup' && (
            <motion.div key="tab-topup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <TopUpSection />
            </motion.div>
          )}
          {activeTab === 'food' && (
            <motion.div key="tab-food" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <FoodSection />
            </motion.div>
          )}
          {activeTab === 'travel' && (
            <motion.div key="tab-travel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <TravelSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <CartDrawer />
      <ReferralDialog open={referralOpen} onClose={() => setReferralOpen(false)} />

      {/* Referral Floating Button — only on Store & Travel tabs */}
      {(activeTab === 'store' || activeTab === 'travel') && (
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.5 }}
          onClick={() => setReferralOpen(true)}
          className="store-floating-button-secondary fixed right-4 z-50 flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-pink-500 md:right-5 md:h-12 md:gap-2.5 md:px-5"
          aria-label="Buka Referral Program"
        >
          <Gift className="size-5" />
          <span>Referral</span>
        </motion.button>
      )}
    </div>
  )
}

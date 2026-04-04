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
    }, 2600)
    return () => clearInterval(timer)
  }, [goToNextPartner, partners.length])

  if (loading) {
    return (
      <section className="py-6 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto max-w-md">
            <div className="mb-4 h-4 w-28 animate-pulse rounded-full bg-white/5 mx-auto" />
            <div className="rounded-[2rem] border border-white/6 bg-white/[0.03] p-4 shadow-2xl shadow-black/20">
              <div className="h-48 animate-pulse rounded-[1.5rem] bg-white/5 sm:h-56" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (partners.length === 0) return null
  const currentPartner = partners[activeIndex]
  const hasLink = !!currentPartner.link
  const cardContent = (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
      <div className="text-center text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
        Supported by
      </div>

      <div className="mt-4 flex min-h-[12rem] items-center justify-center rounded-[1.6rem] border border-white/6 bg-white/[0.03] px-6 py-8 sm:min-h-[14rem] sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPartner.id}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex h-full w-full items-center justify-center"
          >
            {!imgErrors[currentPartner.id] ? (
              <img
                src={currentPartner.image}
                alt={currentPartner.name}
                className="max-h-24 w-auto max-w-full object-contain sm:max-h-32"
                onError={() => setImgErrors((prev) => ({ ...prev, [currentPartner.id]: true }))}
              />
            ) : (
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground sm:text-xl">
                  {currentPartner.name}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"
            animate={{ width: `${((activeIndex + 1) / partners.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-white/45">
          {activeIndex + 1}/{partners.length}
        </span>
      </div>
    </div>
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
            {cardContent}
          </a>
        ) : (
          <div aria-label={currentPartner.name}>
            {cardContent}
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

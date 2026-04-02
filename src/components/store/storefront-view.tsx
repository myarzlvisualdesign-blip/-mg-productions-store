'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift } from 'lucide-react'

// Store Components
import StoreHeader from '@/components/shared/store-header'
import HeroSection from '@/components/store/hero-section'
import CartDrawer from '@/components/store/cart-drawer'
import Footer from '@/components/shared/footer'
import BottomNav, { type BottomTab } from '@/components/store/bottom-nav'
import ReferralDialog from '@/components/store/referral-dialog'
import PWAInstallBanner from '@/components/shared/pwa-install-banner'
import { toast } from 'sonner'
import { fetchJsonWithRetry } from '@/lib/client-fetch'

// Dynamic imports with SSR disabled — prevents hydration mismatch from Turbopack cache staleness
const ProductGrid = dynamic(() => import('@/components/store/product-grid'), { ssr: false })
const TopUpSection = dynamic(() => import('@/components/store/topup-section'), { ssr: false })
const FoodSection = dynamic(() => import('@/components/store/food-section'), { ssr: false })
const TravelSection = dynamic(() => import('@/components/store/travel-section'), { ssr: false })

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

  useEffect(() => {
    async function fetchPartners() {
      try {
        const data = await fetchJsonWithRetry<PartnerData[]>('/api/partners')
        if (Array.isArray(data)) setPartners(data)
      } catch {
        console.error('Failed to fetch partners')
      } finally {
        setLoading(false)
      }
    }
    fetchPartners()
  }, [])

  useEffect(() => {
    if (partners.length === 0) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % partners.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [partners.length])

  if (loading) {
    return (
      <section className="py-8 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-white/5 mb-6 mx-auto" />
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-14 h-14 rounded-full animate-pulse bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (partners.length === 0) return null
  const currentPartner = partners[activeIndex]

  return (
    <section id="featured" className="py-8 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-bold">
            Our Official <span className="gradient-text">Partners</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-base text-muted-foreground max-w-md mx-auto">
            Trusted business partner with high quality selected products
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-5 flex-wrap py-2">
          {partners.map((partner, index) => {
            const isActive = index === activeIndex
            const hasLink = !!partner.link
            const avatar = (
              <div className={`rounded-full transition-all duration-300 ${isActive ? 'p-[3px] bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/25' : 'p-[2px] bg-white/[0.06]'}`}>
                <div className={`rounded-full overflow-hidden bg-muted/20 transition-all duration-300 ${isActive ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12 opacity-50 hover:opacity-80'}`}>
                  {!imgErrors[partner.id] ? (
                    <img src={partner.image} alt={partner.name} className="w-full h-full object-cover" onError={() => setImgErrors(p => ({ ...p, [partner.id]: true }))} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                  )}
                </div>
              </div>
            )

            if (hasLink) {
              return (
                <a key={partner.id} href={partner.link} target="_blank" rel="noopener noreferrer" onClick={() => setActiveIndex(index)} className="relative flex-shrink-0 transition-all duration-300 focus:outline-none" aria-label={partner.name}>{avatar}</a>
              )
            }
            return (
              <button key={partner.id} onClick={() => setActiveIndex(index)} className="relative flex-shrink-0 transition-all duration-300 focus:outline-none" aria-label={partner.name}>{avatar}</button>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5 sm:mt-6">
          {partners.map((_, index) => (
            <button key={index} onClick={() => setActiveIndex(index)} className="transition-all duration-300 focus:outline-none">
              <div className={`rounded-full transition-all duration-300 ${index === activeIndex ? 'w-6 h-1.5 bg-purple-500' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentPartner.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-4 sm:mt-5 text-center">
            <h3 className="text-sm sm:text-lg font-semibold text-foreground leading-tight">{currentPartner.name}</h3>
            <p className="mt-0.5 text-[11px] sm:text-sm text-muted-foreground line-clamp-1 px-4">{currentPartner.description}</p>
          </motion.div>
        </AnimatePresence>
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
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="storefront-main flex-1 pb-24 md:pb-0">
        <div className="hidden md:flex justify-center pt-6 pb-2 px-6">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur-xl">
            {[
              { id: 'store' as BottomTab, label: 'Store' },
              { id: 'topup' as BottomTab, label: 'Top Up' },
              { id: 'food' as BottomTab, label: 'Food' },
              { id: 'travel' as BottomTab, label: 'Travel' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
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
          className="fixed bottom-40 right-4 sm:bottom-24 z-50 flex items-center gap-2.5 h-12 px-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30 text-sm font-semibold"
          aria-label="Buka Referral Program"
        >
          <Gift className="size-5" />
          <span className="hidden sm:inline">Referral</span>
        </motion.button>
      )}
    </div>
  )
}

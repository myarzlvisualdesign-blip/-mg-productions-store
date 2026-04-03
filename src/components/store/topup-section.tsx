'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, ArrowRight, ChevronDown, ChevronUp, ChevronRight, ExternalLink } from 'lucide-react'
import InAppBrowser from '@/components/shared/in-app-browser'
import { fetchJsonWithRetry } from '@/lib/client-fetch'
import { subscribeLiveSync } from '@/lib/live-sync'
import { useLiveRefresh } from '@/hooks/use-live-refresh'

const MAX_CARDS = 5
const MAX_SUB_ITEMS = 5

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

// ─── Types ───────────────────────────────────────────────────────────

interface TopUpItem {
  id: string
  name: string
  subtitle: string
  emoji: string
  color: string
  items: string
  link: string
  image: string
  order: number
  active: boolean
}

interface BannerItem {
  id: string
  title: string
  subtitle: string
  badge: string
  image: string
  link: string
  color: string
  order: number
  active: boolean
}

// ─── Banner Slider ───────────────────────────────────────────────────

function BannerSlider({ onOpenBrowser }: { onOpenBrowser: (link: string, title: string) => void }) {
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchBanners = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await fetchJsonWithRetry<BannerItem[]>('/api/topup-banners')
      if (Array.isArray(data)) {
        setBanners(data)
        setActiveIndex((prev) => (data.length === 0 ? 0 : Math.min(prev, data.length - 1)))
      }
    } catch {
      console.error('Failed to fetch topup banners')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchBanners()
  }, [fetchBanners])

  useEffect(() => subscribeLiveSync(['topup-banners'], () => {
    void fetchBanners({ silent: true })
  }), [fetchBanners])

  useLiveRefresh(
    useCallback(() => fetchBanners({ silent: true }), [fetchBanners]),
    { intervalMs: 15000 }
  )

  // Auto-slide
  useEffect(() => {
    if (banners.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [banners.length, isPaused])

  // Loading skeleton
  if (loading) {
    return (
      <div className="mb-6 sm:mb-8">
        <div className="relative w-full h-40 sm:h-48 lg:h-56 rounded-2xl overflow-hidden animate-pulse bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10" />
        </div>
      </div>
    )
  }

  if (banners.length === 0) return null

  const current = banners[activeIndex]
  const isClickable = !!current.link

  return (
    <div className="mb-6 sm:mb-8">
      {/* Slider Card */}
      <div
        className={`relative w-full h-40 sm:h-48 lg:h-56 rounded-2xl overflow-hidden select-none ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (current.link) onOpenBrowser(current.link, current.title)
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => {
          setTimeout(() => setIsPaused(false), 3000)
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
            className="absolute inset-0"
          >
            {/* Background image or gradient fallback */}
            {!imgErrors[current.id] && current.image ? (
              <img
                src={current.image}
                alt={current.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImgErrors((p) => ({ ...p, [current.id]: true }))}
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${current.color}`} />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
              {/* Badge */}
              {current.badge && (
                <div className="mb-2 sm:mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-white/15 backdrop-blur-md text-white border border-white/10">
                    {current.badge}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white leading-tight mb-0.5 sm:mb-1">
                {current.title}
              </h3>

              {/* Subtitle */}
              {current.subtitle && (
                <p className="text-[11px] sm:text-xs lg:text-sm text-white/70 line-clamp-2 max-w-lg">
                  {current.subtitle}
                </p>
              )}

              {/* Clickable indicator */}
              {isClickable && (
                <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-white/80 group/cta">
                  <span className="text-[10px] sm:text-xs font-medium">Selengkapnya</span>
                  <ArrowRight className="size-3 sm:size-3.5 group-hover/cta:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
          <motion.div
            key={`progress-${activeIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>

        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex(index)
                }}
                className={`rounded-full transition-all duration-300 focus:outline-none ${
                  index === activeIndex
                    ? 'w-5 h-1.5 bg-white/90'
                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Top Up Section ─────────────────────────────────────────────

export default function TopUpSection() {
  const [services, setServices] = useState<TopUpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [browserUrl, setBrowserUrl] = useState('')
  const [browserTitle, setBrowserTitle] = useState('')
  const [browserOpen, setBrowserOpen] = useState(false)

  const fetchServices = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await fetchJsonWithRetry<TopUpItem[]>('/api/topup')
      if (Array.isArray(data)) setServices(data)
    } catch {
      console.error('Failed to fetch topup services')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchServices()
  }, [fetchServices])

  useEffect(() => subscribeLiveSync(['topup'], () => {
    void fetchServices({ silent: true })
  }), [fetchServices])

  useLiveRefresh(
    useCallback(() => fetchServices({ silent: true }), [fetchServices]),
    { intervalMs: 15000 }
  )

  const parseItems = (itemsJson: string): string[] => {
    try { return JSON.parse(itemsJson) } catch { return [] }
  }

  const openBrowser = (link: string, title: string) => {
    setBrowserUrl(link)
    setBrowserTitle(title)
    setBrowserOpen(true)
  }

  const hasMoreCards = services.length > MAX_CARDS
  const visibleServices = expanded ? services : services.slice(0, MAX_CARDS)
  const hiddenCardCount = services.length - MAX_CARDS

  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg shadow-purple-500/20 mb-4">
            <Coins className="size-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold">
            Top Up <span className="gradient-text">Koin & Diamond</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Game & e-wallet top-up dengan harga termurah, proses instan
          </p>
        </div>

        {/* Banner Slider */}
        <BannerSlider onOpenBrowser={openBrowser} />

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="h-20 bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && services.length > 0 && (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
            >
              <AnimatePresence mode="popLayout">
                {visibleServices.map((service) => {
                  const parsedItems = parseItems(service.items)
                  const hasMoreItems = parsedItems.length > MAX_SUB_ITEMS
                  const isCardExpanded = expandedCards.has(service.id)
                  const visibleItems = isCardExpanded ? parsedItems : parsedItems.slice(0, MAX_SUB_ITEMS)

                  return (
                    <motion.div
                      key={service.id}
                      variants={itemVariants}
                      layout
                      className="group glass-card rounded-xl overflow-hidden hover:border-purple-500/20 transition-all duration-300 relative"
                    >
                      {/* Header */}
                      <div className={`relative bg-gradient-to-r ${service.color} p-3 sm:p-4`}>
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg sm:text-xl overflow-hidden">
                            {service.image ? (
                              <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{service.emoji}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-white truncate">{service.name}</h3>
                            <p className="text-[9px] sm:text-[11px] text-white/70 truncate">{service.subtitle}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (service.link) openBrowser(service.link, service.name)
                          }}
                          disabled={!service.link}
                          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:cursor-default disabled:opacity-55 disabled:hover:bg-white/15"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Buka</span>
                        </button>
                      </div>

                      {/* Sub-items */}
                      <div className="p-2 sm:p-3 space-y-1">
                        <AnimatePresence>
                          {visibleItems.map((item: string) => (
                            <motion.div
                              key={item}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors group/item"
                            >
                              <span className="font-medium">{item}</span>
                              <ArrowRight className="size-3 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all text-purple-400" />
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Lihat Lainnya inside card — sub-items > 5 */}
                        {hasMoreItems && (
                          <button
                            onClick={() => toggleCardExpand(service.id)}
                            className="w-full flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors mt-1"
                          >
                            <span>{isCardExpanded ? 'Sembunyikan' : 'Lihat Lainnya'}</span>
                            {isCardExpanded
                              ? <ChevronUp className="size-3" />
                              : <ChevronRight className="size-3" />
                            }
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>

            {/* Lihat Lainnya — cards > 5 */}
            {hasMoreCards && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex justify-center"
              >
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="glass-card rounded-xl px-6 py-3 flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 hover:border-purple-500/30 transition-all duration-300 group"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="size-4 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4 group-hover:translate-y-0.5 transition-transform" />
                      <span>Lihat Lainnya</span>
                      <span className="text-[10px] text-muted-foreground">({hiddenCardCount} lagi)</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* Empty */}
        {!loading && services.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-6 sm:p-8 text-center"
          >
            <p className="text-sm text-muted-foreground">Belum ada layanan top-up tersedia.</p>
          </motion.div>
        )}
      </div>
      <InAppBrowser url={browserUrl} title={browserTitle} open={browserOpen} onClose={() => setBrowserOpen(false)} />
    </section>
  )
}

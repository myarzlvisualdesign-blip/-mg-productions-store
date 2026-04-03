'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, ArrowRight, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import InAppBrowser from '@/components/shared/in-app-browser'
import ServiceActionButton from '@/components/store/service-action-button'
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

interface TravelItem {
  id: string
  name: string
  subtitle: string
  emoji: string
  color: string
  items: string
  desc: string
  link: string
  image: string
  order: number
  active: boolean
}

interface SubItem {
  name: string
  price?: string
}

interface DestinationItem {
  id: string
  name: string
  subtitle: string
  emoji: string
  color: string
  image: string
  order: number
  active: boolean
}

// ─── Popular Destinations Auto Slider ────────────────────────────────

function PopularDestinationsSlider() {
  const [destinations, setDestinations] = useState<DestinationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDestinations = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await fetchJsonWithRetry<DestinationItem[]>('/api/destinations')
      if (Array.isArray(data)) {
        setDestinations(data)
        setActiveIndex((prev) => (data.length === 0 ? 0 : Math.min(prev, data.length - 1)))
      }
    } catch {
      console.error('Failed to fetch destinations')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch destinations
  useEffect(() => {
    void fetchDestinations()
  }, [fetchDestinations])

  useEffect(() => subscribeLiveSync(['destinations'], () => {
    void fetchDestinations({ silent: true })
  }), [fetchDestinations])

  useLiveRefresh(
    useCallback(() => fetchDestinations({ silent: true }), [fetchDestinations]),
    { intervalMs: 15000 }
  )

  // Auto-slide timer
  useEffect(() => {
    if (destinations.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % destinations.length)
    }, 4000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [destinations.length, isPaused])

  // Loading skeleton
  if (loading) {
    return (
      <div className="mt-6 sm:mt-8">
        <div className="h-5 w-44 animate-pulse rounded-lg bg-white/5 mb-4" />
        <div className="relative w-full h-48 sm:h-64 lg:h-72 rounded-2xl overflow-hidden animate-pulse bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10" />
        </div>
      </div>
    )
  }

  if (destinations.length === 0) return null

  const current = destinations[activeIndex]

  return (
    <div className="mt-6 sm:mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          📍 Destinasi Populer
        </h3>
        <span className="text-[10px] text-muted-foreground/60">
          {activeIndex + 1} / {destinations.length}
        </span>
      </div>

      {/* Slider Card — NOT clickable for public */}
      <div
        className="relative w-full h-48 sm:h-56 lg:h-64 rounded-2xl overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => {
          // Resume after 3s on mobile
          setTimeout(() => setIsPaused(false), 3000)
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
            className="absolute inset-0"
          >
            {/* Background Image or Gradient fallback */}
            {!imgErrors[current.id] && current.image ? (
              <img
                src={current.image}
                alt={current.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImgErrors((p) => ({ ...p, [current.id]: true }))}
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${current.color}`} />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <div className="flex items-end justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                    <span className="text-2xl sm:text-3xl">{current.emoji}</span>
                    <h4 className="text-lg sm:text-2xl font-bold text-white truncate">{current.name}</h4>
                  </div>
                  {current.subtitle && (
                    <p className="text-xs sm:text-sm text-white/70 truncate pl-[40px] sm:pl-[44px]">
                      {current.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <motion.div
            key={`progress-${activeIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {destinations.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`rounded-full transition-all duration-300 focus:outline-none ${
              index === activeIndex
                ? 'w-6 h-2 bg-gradient-to-r from-purple-500 to-blue-500'
                : 'w-2 h-2 bg-white/15 hover:bg-white/30'
            }`}
            aria-label={`Destinasi ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main Travel Section ─────────────────────────────────────────────

export default function TravelSection() {
  const [services, setServices] = useState<TravelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [browserUrl, setBrowserUrl] = useState('')
  const [browserTitle, setBrowserTitle] = useState('')
  const [browserOpen, setBrowserOpen] = useState(false)

  const fetchTravel = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await fetchJsonWithRetry<TravelItem[]>('/api/travel')
      if (Array.isArray(data)) setServices(data)
    } catch {
      console.error('Failed to fetch travel services')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchTravel()
  }, [fetchTravel])

  useEffect(() => subscribeLiveSync(['travel'], () => {
    void fetchTravel({ silent: true })
  }), [fetchTravel])

  useLiveRefresh(
    useCallback(() => fetchTravel({ silent: true }), [fetchTravel]),
    { intervalMs: 15000 }
  )

  const parseItems = (itemsJson: string): SubItem[] => {
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
    <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-sky-500/20 mb-4">
            <Plane className="size-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold">
            <span className="gradient-text">Travel</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Tiket pesawat, hotel, & paket wisata terbaik untuk perjalananmu
          </p>
        </div>

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

        {/* Service Cards */}
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
                      className="glass-card rounded-xl overflow-hidden hover:border-purple-500/20 transition-all duration-300 group relative"
                    >
                      {/* Header */}
                      <div className={`bg-gradient-to-br ${service.color} p-3 sm:p-4`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl sm:text-2xl overflow-hidden">
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
                      </div>

                      {/* Body */}
                      <div className="p-3 sm:p-4">
                        {/* Description only (no sub-items) */}
                        {service.desc && parsedItems.length === 0 && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{service.desc}</p>
                        )}

                        {/* Sub-items list */}
                        {parsedItems.length > 0 && (
                          <div className="space-y-1">
                            <AnimatePresence>
                              {visibleItems.map((item: SubItem, i: number) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="w-full flex items-center justify-between px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors group/sub"
                                >
                                  <span className="font-medium truncate">{item.name}</span>
                                  {item.price && <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{item.price}</span>}
                                  <ArrowRight className="size-3 opacity-0 -translate-x-1 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all text-purple-400 shrink-0 ml-1" />
                                </motion.div>
                              ))}
                            </AnimatePresence>

                            {/* Lihat Lainnya inside card — sub-items > 5 */}
                            {hasMoreItems && (
                              <button
                                onClick={() => toggleCardExpand(service.id)}
                                className="w-full flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-lg text-[10px] sm:text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors mt-1"
                              >
                                <span>{isCardExpanded ? 'Sembunyikan' : 'Lihat Lainnya'}</span>
                                {isCardExpanded
                                  ? <ChevronUp className="size-3" />
                                  : <ChevronRight className="size-3" />
                                }
                              </button>
                            )}
                          </div>
                        )}

                        <div className="mt-3">
                          <ServiceActionButton
                            link={service.link}
                            title={service.name}
                            category="travel"
                            onVisit={openBrowser}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-foreground transition-colors hover:bg-white/[0.07]"
                          />
                        </div>
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
            <p className="text-sm text-muted-foreground">Belum ada layanan travel tersedia.</p>
          </motion.div>
        )}

        {/* Popular Destinations Auto Slider */}
        <PopularDestinationsSlider />

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 sm:mt-8 glass-card rounded-xl p-4 sm:p-6 text-center border border-purple-500/10"
        >
          <p className="text-xs sm:text-sm text-muted-foreground">
            ✈️ Fitur travel akan segera tersedia. Hubungi admin untuk booking manual.
          </p>
        </motion.div>
      </div>
      <InAppBrowser url={browserUrl} title={browserTitle} open={browserOpen} onClose={() => setBrowserOpen(false)} />
    </section>
  )
}

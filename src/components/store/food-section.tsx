'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, ArrowRight, ExternalLink, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import InAppBrowser from '@/components/shared/in-app-browser'
import { fetchJsonWithRetry } from '@/lib/client-fetch'

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

interface FoodItemData {
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

interface MenuItem {
  name: string
  price: string
}

export default function FoodSection() {
  const [categories, setCategories] = useState<FoodItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [browserUrl, setBrowserUrl] = useState('')
  const [browserTitle, setBrowserTitle] = useState('')
  const [browserOpen, setBrowserOpen] = useState(false)
  useEffect(() => {
    async function fetchFood() {
      try {
        const data = await fetchJsonWithRetry<FoodItemData[]>('/api/food')
        if (Array.isArray(data)) setCategories(data)
      } catch {
        console.error('Failed to fetch food items')
      } finally {
        setLoading(false)
      }
    }
    fetchFood()
  }, [])

  const parseItems = (itemsJson: string): MenuItem[] => {
    try { return JSON.parse(itemsJson) } catch { return [] }
  }

  const openBrowser = (link: string, title: string) => {
    setBrowserUrl(link)
    setBrowserTitle(title)
    setBrowserOpen(true)
  }

  const hasMoreCards = categories.length > MAX_CARDS
  const visibleCategories = expanded ? categories : categories.slice(0, MAX_CARDS)
  const hiddenCardCount = categories.length - MAX_CARDS

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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg shadow-orange-500/20 mb-4">
            <UtensilsCrossed className="size-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold">
            <span className="gradient-text">Drink & Food</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Pesan makanan & minuman favorit, antar langsung ke tempatmu
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="h-16 bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-2 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && categories.length > 0 && (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            >
              <AnimatePresence mode="popLayout">
                {visibleCategories.map((cat) => {
                  const menuItems = parseItems(cat.items)
                  const hasMoreItems = menuItems.length > MAX_SUB_ITEMS
                  const isCardExpanded = expandedCards.has(cat.id)
                  const visibleItems = isCardExpanded ? menuItems : menuItems.slice(0, MAX_SUB_ITEMS)

                  return (
                    <motion.div
                      key={cat.id}
                      variants={itemVariants}
                      layout
                      onClick={() => {
                        if (cat.link) openBrowser(cat.link, cat.name)
                      }}
                      className={`glass-card rounded-xl overflow-hidden hover:border-purple-500/20 transition-all duration-300 relative ${cat.link ? 'cursor-pointer' : ''}`}
                    >
                      {/* Header */}
                      <div className={`bg-gradient-to-r ${cat.color} px-4 py-3`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg overflow-hidden">
                            {cat.image ? (
                              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{cat.emoji}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                            <p className="text-[11px] text-white/70">{cat.subtitle}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sub-items */}
                      <div className="divide-y divide-white/[0.04]">
                        <AnimatePresence>
                          {visibleItems.map((item: MenuItem) => (
                            <motion.button
                              key={item.name}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (cat.link) openBrowser(cat.link, cat.name)
                              }}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors group/item"
                            >
                              <div className="text-left">
                                <p className="text-xs font-medium text-foreground">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground">{item.price}</p>
                              </div>
                              <ArrowRight className="size-3.5 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all text-purple-400" />
                            </motion.button>
                          ))}
                        </AnimatePresence>

                        {/* Lihat Lainnya inside card — sub-items > 5 */}
                        {hasMoreItems && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (cat.link) {
                                openBrowser(cat.link, cat.name)
                              } else {
                                toggleCardExpand(cat.id)
                              }
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[10px] sm:text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                          >
                            <span>{isCardExpanded ? 'Sembunyikan' : 'Lihat Lainnya'}</span>
                            {isCardExpanded
                              ? <ChevronUp className="size-3" />
                              : <ChevronRight className="size-3" />
                            }
                          </button>
                        )}
                      </div>

                      {/* External link badge */}
                      {cat.link && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-blue-500/90 text-white text-[8px] font-medium flex items-center gap-0.5 shadow-sm">
                          <ExternalLink className="h-2 w-2" />
                          <span>Buka</span>
                        </div>
                      )}
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
        {!loading && categories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-6 sm:p-8 text-center"
          >
            <p className="text-sm text-muted-foreground">Belum ada menu makanan & minuman tersedia.</p>
          </motion.div>
        )}

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 glass-card rounded-xl p-4 sm:p-6 text-center border border-purple-500/10"
        >
          <p className="text-xs sm:text-sm text-muted-foreground">
            🍜 Fitur pemesanan makanan & minuman akan segera tersedia. Hubungi admin untuk pemesanan manual.
          </p>
        </motion.div>
      </div>
      <InAppBrowser url={browserUrl} title={browserTitle} open={browserOpen} onClose={() => setBrowserOpen(false)} />
    </section>
  )
}

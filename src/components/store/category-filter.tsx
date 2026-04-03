'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchJsonWithRetry } from '@/lib/client-fetch'
import { subscribeLiveSync } from '@/lib/live-sync'

interface CategoryFilterProps {
  selectedCategory: string
  onSelect: (category: string) => void
}

export default function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [categories, setCategories] = useState<string[]>(['All'])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollStart = useRef(0)

  const fetchCategories = useCallback(async () => {
    try {
      const data = await fetchJsonWithRetry<Array<{ name: string }>>('/api/categories')
      if (Array.isArray(data) && data.length > 0) {
        setCategories(['All', ...data.map((c: { name: string }) => c.name)])
      } else {
        setCategories(['All'])
      }
    } catch {
      console.error('Failed to fetch categories')
    }
  }, [])

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  useEffect(() => subscribeLiveSync(['categories'], () => {
    void fetchCategories()
  }), [fetchCategories])

  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
      onSelect('All')
    }
  }, [categories, onSelect, selectedCategory])

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)

    // Calculate scroll progress percentage
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll > 0) {
      setScrollProgress(el.scrollLeft / maxScroll)
    } else {
      setScrollProgress(0)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Small delay to let layout settle after categories load
    const timer = setTimeout(() => {
      checkScroll()
    }, 100)
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [categories, checkScroll])

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.55
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }, [])

  const handleSelect = (category: string) => {
    onSelect(category)
    // Smooth scroll the selected pill into center view
    const idx = categories.indexOf(category)
    const el = scrollRef.current?.children[idx] as HTMLElement | undefined
    if (el && scrollRef.current) {
      const container = scrollRef.current
      const scrollLeft =
        el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }

  // ── Mouse drag to scroll (for desktop) ──────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    isDragging.current = true
    startX.current = e.pageX
    scrollStart.current = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.scrollBehavior = 'auto'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    const el = scrollRef.current
    if (!el) return
    const dx = e.pageX - startX.current
    el.scrollLeft = scrollStart.current - dx
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    const el = scrollRef.current
    if (!el) return
    el.style.cursor = ''
    el.style.scrollBehavior = 'smooth'
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      const el = scrollRef.current
      if (!el) return
      el.style.cursor = ''
      el.style.scrollBehavior = 'smooth'
    }
  }, [])

  const isOverflowing = canScrollLeft || canScrollRight

  return (
    <div className="relative">
      {/* Main row: arrows sit OUTSIDE the scroll track in their own space */}
      <div className="flex items-center gap-2">
        {/* ── Left Arrow ──────────────────────────────────────────── */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={cn(
            'flex-shrink-0 z-10',
            'h-8 w-8 sm:h-9 sm:w-9 rounded-full',
            'flex items-center justify-center',
            'glass-card border border-purple-500/20',
            'text-muted-foreground hover:text-purple-300',
            'hover:bg-purple-500/10 hover:border-purple-500/40',
            'active:scale-95',
            'transition-all duration-200',
            'disabled:opacity-0 disabled:pointer-events-none',
            // Hide when no overflow — takes no space
            !isOverflowing && 'w-0 h-0 overflow-hidden opacity-0'
          )}
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* ── Scroll Track ────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0 overflow-hidden">
          {/* Fade edges — subtle gradient hints */}
          {isOverflowing && canScrollLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background via-background/80 to-transparent z-[5]" />
          )}
          {isOverflowing && canScrollRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background via-background/80 to-transparent z-[5]" />
          )}

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'flex items-center gap-2 sm:gap-3 overflow-x-auto',
              'py-1.5 px-1',
              // Smooth scroll
              'scroll-smooth',
              // Snap scroll — each pill snaps into view when swiping
              '[scroll-snap-type:x_proximity]',
              // Touch momentum scrolling on iOS
              '[-webkit-overflow-scrolling:touch]',
              // Hide native scrollbar
              '[scrollbar-width:none]',
              '[&::-webkit-scrollbar]:hidden',
              // Prevent text selection while swiping
              'select-none',
              // Desktop cursor
              'cursor-grab'
            )}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => handleSelect(category)}
                  className={cn(
                    'relative shrink-0 rounded-full',
                    'scroll-snap-center',
                    'px-4 sm:px-5 py-1.5 sm:py-2',
                    'text-xs sm:text-sm font-medium whitespace-nowrap',
                    'transition-all duration-200',
                    // Tap highlight on mobile
                    '[-webkit-tap-highlight-color:transparent]'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="category-indicator"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/25"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10 transition-colors rounded-full px-1',
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    {category}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right Arrow ─────────────────────────────────────────── */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={cn(
            'flex-shrink-0 z-10',
            'h-8 w-8 sm:h-9 sm:w-9 rounded-full',
            'flex items-center justify-center',
            'glass-card border border-purple-500/20',
            'text-muted-foreground hover:text-purple-300',
            'hover:bg-purple-500/10 hover:border-purple-500/40',
            'active:scale-95',
            'transition-all duration-200',
            'disabled:opacity-0 disabled:pointer-events-none',
            // Hide when no overflow — takes no space
            !isOverflowing && 'w-0 h-0 overflow-hidden opacity-0'
          )}
          aria-label="Scroll categories right"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* ── Scroll Progress Bar ────────────────────────────────────── */}
      {isOverflowing && (
        <div className="mt-2.5 mx-1" ref={trackRef}>
          <div className="h-0.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
              style={{
                width: `${Math.max(15, 100 / categories.length)}%`,
              }}
              animate={{
                x: `${scrollProgress * (100 - Math.max(15, 100 / categories.length))}%`,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Coins, UtensilsCrossed, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BottomTab = 'store' | 'topup' | 'food' | 'travel'

interface BottomNavProps {
  activeTab: BottomTab
  onTabChange: (tab: BottomTab) => void
}

const tabs: { id: BottomTab; label: string; icon: typeof ShoppingBag }[] = [
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'topup', label: 'Top Up', icon: Coins },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'travel', label: 'Travel', icon: Plane },
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="store-bottom-nav fixed left-0 right-0 z-50"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-lg">
        <div className="mx-2 rounded-2xl glass-card border border-white/[0.08] shadow-2xl shadow-black/40 sm:mx-3 md:mb-2">
          <div className="flex items-center justify-around py-1.5 px-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl',
                    'transition-all duration-200',
                    '[-webkit-tap-highlight-color:transparent]',
                    isActive ? 'text-purple-400' : 'text-muted-foreground/60 hover:text-muted-foreground'
                  )}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-pill"
                      className="absolute inset-1 rounded-xl bg-purple-500/[0.08] border border-purple-500/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}

                  {/* Icon */}
                  <div className="relative z-10">
                    <Icon
                      className={cn(
                        'transition-all duration-200',
                        isActive ? 'size-[22px]' : 'size-5'
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'relative z-10 transition-all duration-200',
                      isActive ? 'text-[10px] font-semibold text-purple-300' : 'text-[10px] font-medium'
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

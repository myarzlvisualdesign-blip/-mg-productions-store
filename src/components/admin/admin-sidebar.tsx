'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  PlusCircle,
  Users,
  Tag,
  Coins,
  UtensilsCrossed,
  Plane,
  MapPin,
  Image,
  MessageCircle,
  Gift,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useViewStore } from '@/store/view-store'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { id: 'overview' as const, icon: LayoutDashboard, label: 'Overview' },
  { id: 'orders' as const, icon: ShoppingCart, label: 'Orders' },
  { id: 'inventory' as const, icon: Package, label: 'Inventory' },
  { id: 'products' as const, icon: PlusCircle, label: 'Add Product' },
  { id: 'categories' as const, icon: Tag, label: 'Categories' },
  { id: 'partners' as const, icon: Users, label: 'Partners' },
]

const serviceItems = [
  { id: 'topup' as const, icon: Coins, label: 'Top Up', emoji: '🎮' },
  { id: 'topup-banners' as const, icon: Image, label: 'Banner', emoji: '🖼️' },
  { id: 'food' as const, icon: UtensilsCrossed, label: 'Food', emoji: '🍜' },
  { id: 'travel' as const, icon: Plane, label: 'Travel', emoji: '✈️' },
  { id: 'destinations' as const, icon: MapPin, label: 'Destinasi', emoji: '📍' },
]

const toolItems = [
  { id: 'chatbot' as const, icon: MessageCircle, label: 'AI Chatbot', emoji: '🤖' },
  { id: 'referral' as const, icon: Gift, label: 'Referral', emoji: '🎁' },
]

export default function AdminSidebar() {
  const [expanded, setExpanded] = useState(false)
  const { adminTab, setAdminTab, toggleView } = useViewStore()
  const itemLayoutClass = expanded
    ? 'justify-start px-3'
    : 'justify-center px-0'

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: expanded ? 256 : 64 }}
        transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
        className="fixed left-0 top-0 z-40 flex h-screen flex-col glass-card border-r border-white/[0.06]"
      >
        {/* Top: Logo + Toggle */}
        <div
          className={`flex items-center border-b border-white/[0.06] py-5 ${
            expanded ? 'gap-3 px-4' : 'justify-center px-3'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 overflow-hidden">
            <img
              src="/logo-sm.png"
              alt="MG"
              className="h-6 w-auto object-contain rounded"
            />
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="text-sm font-bold text-foreground leading-tight">MG PRODUCTIONS</p>
                <p className="text-[11px] text-muted-foreground">Admin Panel</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className={`h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 ${
              expanded ? 'ml-auto' : 'absolute right-3 top-6'
            }`}
          >
            {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = adminTab === item.id
            const Icon = item.icon

            const button = (
              <motion.button
                key={item.id}
                onClick={() => setAdminTab(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${itemLayoutClass} ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/80 to-indigo-600/60 text-white shadow-lg shadow-purple-500/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/60 -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            )

            if (expanded) return button
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}

          {/* Separator */}
          <div className="my-2">
            <Separator className="bg-white/[0.06]" />
          </div>

          {/* Services Section Label */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-1.5"
            >
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                Services
              </span>
            </motion.div>
          )}

          {/* Service Items */}
          {serviceItems.map((item) => {
            const isActive = adminTab === item.id
            const Icon = item.icon

            const button = (
              <motion.button
                key={item.id}
                onClick={() => setAdminTab(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${itemLayoutClass} ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/80 to-indigo-600/60 text-white shadow-lg shadow-purple-500/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <span className="shrink-0 text-base">{item.emoji}</span>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/60 -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            )

            if (expanded) return button
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}

          {/* Tools Separator */}
          <div className="my-2">
            <Separator className="bg-white/[0.06]" />
          </div>

          {/* Tools Section Label */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-1.5"
            >
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                Tools
              </span>
            </motion.div>
          )}

          {/* Tool Items */}
          {toolItems.map((item) => {
            const isActive = adminTab === item.id
            const Icon = item.icon

            const button = (
              <motion.button
                key={item.id}
                onClick={() => setAdminTab(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${itemLayoutClass} ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/80 to-indigo-600/60 text-white shadow-lg shadow-purple-500/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <span className="shrink-0 text-base">{item.emoji}</span>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/60 -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            )

            if (expanded) return button
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom: Back to Store */}
        <div className="border-t border-white/[0.06] px-3 py-4">
          {expanded ? (
            <Button
              variant="ghost"
              onClick={toggleView}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl px-3"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" />
              <AnimatePresence>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  Back to Store
                </motion.span>
              </AnimatePresence>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={toggleView}
                  className="w-full justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl px-0"
                >
                  <ArrowLeft className="h-5 w-5 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">Back to Store</TooltipContent>
            </Tooltip>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

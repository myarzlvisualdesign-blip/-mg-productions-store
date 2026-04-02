'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useViewStore } from '@/store/view-store'
import { useAuthStore } from '@/store/auth-store'
import dynamic from 'next/dynamic'

// Store Components — loaded with ssr: false to prevent hydration mismatch
const Storefront = dynamic(() => import('@/components/store/storefront-view'), { ssr: false })
const PWAInstallBanner = dynamic(() => import('@/components/shared/pwa-install-banner'), { ssr: false })

// Admin Components
import AdminLoginDialog from '@/components/shared/admin-login-dialog'
import AdminSidebar from '@/components/admin/admin-sidebar'
import AdminOverview from '@/components/admin/admin-overview'
import OrdersTable from '@/components/admin/orders-table'
import InventoryTable from '@/components/admin/inventory-table'
import ProductForm from '@/components/admin/product-form'
import PartnerForm from '@/components/admin/partner-form'
import PartnersTable from '@/components/admin/partners-table'
import CategoriesManager from '@/components/admin/categories-manager'
import ServiceManager from '@/components/admin/service-manager'
import DestinationManager from '@/components/admin/destination-manager'
import TopUpBannerManager from '@/components/admin/topup-banner-manager'
import ChatbotSettings from '@/components/admin/chatbot-settings'
import ReferralManager from '@/components/admin/referral-manager'
import type { Product } from '@/components/admin/inventory-table'
import type { Partner } from '@/components/admin/partner-form'

// ─── Admin Dashboard ──────────────────────────────────────────────────

function AdminDashboard() {
  const { adminTab } = useViewStore()
  const { isAuthenticated, username, logout, checkAuth, isLoading } = useAuthStore()
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editPartner, setEditPartner] = useState<Partner | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth()
    }
  }, [checkAuth, isAuthenticated])

  const handleEditProduct = useCallback((product: Product) => {
    setEditPartner(null)
    setEditProduct(product)
  }, [])

  const handleEditPartner = useCallback((partner: Partner) => {
    setEditProduct(null)
    setEditPartner(partner)
  }, [])

  const handleDone = useCallback(() => {
    setEditProduct(null)
    setEditPartner(null)
    setRefreshKey(p => p + 1)
  }, [])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    await logout()
    useViewStore.getState().setViewMode('store')
    setLoggingOut(false)
  }, [logout])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 text-purple-400 animate-spin" />
          <p className="text-sm text-muted-foreground">Memverifikasi akses admin...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card rounded-2xl p-6 text-center max-w-sm">
          <p className="text-base font-semibold text-foreground">Sesi admin tidak aktif</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Silakan kembali ke storefront lalu login ulang ke admin panel.
          </p>
          <Button
            className="mt-4"
            onClick={() => useViewStore.getState().setViewMode('store')}
          >
            Kembali ke Store
          </Button>
        </div>
      </div>
    )
  }

  const showForm = editProduct !== null || editPartner !== null

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-16 md:ml-64 transition-all duration-300">
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 glass-card border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Login sebagai <span className="text-foreground font-medium">{username ?? 'Admin'}</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut} className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 gap-2">
            {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Logout
          </Button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {editProduct && (
              <motion.div key="product-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ProductForm editProduct={editProduct} onDone={handleDone} />
              </motion.div>
            )}

            {editPartner && !editProduct && (
              <motion.div key="partner-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <PartnerForm editPartner={editPartner.id === '__new__' ? null : editPartner} onDone={handleDone} />
              </motion.div>
            )}

            {adminTab === 'overview' && !showForm && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <AdminOverview />
              </motion.div>
            )}

            {adminTab === 'orders' && !showForm && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <OrdersTable />
              </motion.div>
            )}

            {adminTab === 'inventory' && !showForm && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <InventoryTable onEditProduct={handleEditProduct} refreshKey={refreshKey} />
              </motion.div>
            )}

            {adminTab === 'products' && !showForm && (
              <motion.div key="add-product" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ProductForm editProduct={null} onDone={handleDone} />
              </motion.div>
            )}

            {adminTab === 'categories' && !showForm && (
              <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <CategoriesManager />
              </motion.div>
            )}

            {adminTab === 'partners' && !showForm && (
              <motion.div key="partners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <PartnersTable onEditPartner={handleEditPartner} refreshKey={refreshKey} />
              </motion.div>
            )}

            {adminTab === 'topup' && !showForm && (
              <motion.div key="topup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ServiceManager type="topup" title="Kelola Top Up Koin & Diamond" description="Tambahkan layanan top-up game dan e-wallet" iconEmoji="🎮" />
              </motion.div>
            )}

            {adminTab === 'topup-banners' && !showForm && (
              <motion.div key="topup-banners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <TopUpBannerManager />
              </motion.div>
            )}

            {adminTab === 'food' && !showForm && (
              <motion.div key="food" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ServiceManager type="food" title="Kelola Drink & Food" description="Tambahkan menu makanan dan minuman" iconEmoji="🍜" />
              </motion.div>
            )}

            {adminTab === 'travel' && !showForm && (
              <motion.div key="travel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ServiceManager type="travel" title="Kelola Travel" description="Tambahkan layanan travel dan wisata" iconEmoji="✈️" />
              </motion.div>
            )}

            {adminTab === 'destinations' && !showForm && (
              <motion.div key="destinations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <DestinationManager />
              </motion.div>
            )}

            {adminTab === 'chatbot' && !showForm && (
              <motion.div key="chatbot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ChatbotSettings />
              </motion.div>
            )}

            {adminTab === 'referral' && !showForm && (
              <motion.div key="referral" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ReferralManager />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// ─── Main Page with Auth Gate ──────────────────────────────────────────

export default function HomePage() {
  const viewMode = useViewStore((s) => s.viewMode)
  const setViewMode = useViewStore((s) => s.setViewMode)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  // ─── Disable stale service workers/caches from previous deploys ───
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {
            // ignore unregister failures
          })
        })
      })
    }

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).catch(() => {
            // ignore cache delete failures
          })
        })
      })
    }
  }, [])

  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const pendingAdminRef = useRef(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      if (state.isAuthenticated && pendingAdminRef.current) {
        pendingAdminRef.current = false
        setLoginDialogOpen(false)
        setViewMode('admin')
      }
    })
    return unsub
  }, [setViewMode])

  const handleToggleView = useCallback(() => {
    const currentMode = useViewStore.getState().viewMode
    if (currentMode === 'store') {
      if (useAuthStore.getState().isAuthenticated) {
        setViewMode('admin')
      } else {
        pendingAdminRef.current = true
        setLoginDialogOpen(true)
      }
    } else {
      setViewMode('store')
    }
  }, [setViewMode])

  useEffect(() => {
    useViewStore.setState({ toggleView: handleToggleView })
  }, [handleToggleView])

  const handleLoginClose = useCallback(() => {
    setLoginDialogOpen(false)
    pendingAdminRef.current = false
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {viewMode === 'store' ? <Storefront /> : <AdminDashboard />}
        </motion.div>
      </AnimatePresence>
      <AdminLoginDialog open={loginDialogOpen} onClose={handleLoginClose} />
      <PWAInstallBanner />
    </>
  )
}

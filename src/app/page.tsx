'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useViewStore } from '@/store/view-store'
import { useAuthStore } from '@/store/auth-store'
import dynamic from 'next/dynamic'
import PWARegister from '@/components/shared/pwa-register'
import StorefrontLiveSync from '@/components/shared/storefront-live-sync'

const Storefront = dynamic(() => import('@/components/store/storefront-view'), { ssr: false })
const AdminDashboard = dynamic(() => import('@/components/admin/admin-dashboard'), { ssr: false })
const AdminLoginDialog = dynamic(() => import('@/components/shared/admin-login-dialog'), { ssr: false })
const PWAInstallBanner = dynamic(() => import('@/components/shared/pwa-install-banner'), { ssr: false })

// ─── Main Page with Auth Gate ──────────────────────────────────────────

export default function HomePage() {
  const viewMode = useViewStore((s) => s.viewMode)
  const setViewMode = useViewStore((s) => s.setViewMode)
  const checkAuth = useAuthStore((s) => s.checkAuth)

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
      <PWARegister />
      {viewMode === 'store' && <StorefrontLiveSync />}
      <AnimatePresence mode="wait">
        <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {viewMode === 'store' ? <Storefront /> : <AdminDashboard />}
        </motion.div>
      </AnimatePresence>
      {viewMode === 'store' && <PWAInstallBanner />}
      <AdminLoginDialog open={loginDialogOpen} onClose={handleLoginClose} />
    </>
  )
}

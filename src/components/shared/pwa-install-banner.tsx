'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Monitor, ArrowDownToLine, Sparkles } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

// ─── Helpers ────────────────────────────────────────────────────────────

// Check if dismissed within last 7 days
function isDismissedRecently(): boolean {
  try {
    const dismissedAt = localStorage.getItem('mg-pwa-dismissed')
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      return Date.now() - dismissedTime < oneWeek
    }
  } catch { /* SSR guard */ }
  return false
}

function usePWAState() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [appInstalled, setAppInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(isDismissedRecently)
  const [showLauncher, setShowLauncher] = useState(isDismissedRecently)

  const isIOSDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true)

  const shouldHide = isStandalone || appInstalled || !showBanner || dismissed

  // iOS: show banner after delay (no beforeinstallprompt event)
  useEffect(() => {
    if (isStandalone || dismissed) return
    if (!isIOSDevice) return

    const timer = setTimeout(() => {
      setShowBanner(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [isStandalone, dismissed, isIOSDevice])

  // Android: capture beforeinstallprompt event
  useEffect(() => {
    if (isStandalone || isIOSDevice || dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone, isIOSDevice, dismissed])

  // App installed event
  useEffect(() => {
    const handler = () => {
      setAppInstalled(true)
      setShowBanner(false)
      setShowLauncher(false)
    }
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  const dismiss = useCallback(() => {
    setShowBanner(false)
    setShowLauncher(true)
    setDismissed(true)
    localStorage.setItem('mg-pwa-dismissed', String(Date.now()))
  }, [])

  const reopenBanner = useCallback(() => {
    setDismissed(false)
    setShowLauncher(false)
    setShowBanner(true)
  }, [])

  return {
    deferredPrompt,
    setDeferredPrompt,
    showBanner,
    showLauncher,
    appInstalled,
    isIOSDevice,
    isStandalone,
    shouldHide,
    dismiss,
    reopenBanner,
  }
}

// ─── Component ─────────────────────────────────────────────────────────

export default function PWAInstallBanner() {
  const {
    deferredPrompt,
    setDeferredPrompt,
    showLauncher,
    appInstalled,
    isIOSDevice,
    isStandalone,
    shouldHide,
    dismiss,
    reopenBanner,
  } = usePWAState()

  // ─── Handle install click (Android) ─────────────────────────────────
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      reopenBanner()
      return
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)

    if (outcome === 'accepted') {
      return
    }

    dismiss()
  }, [deferredPrompt, dismiss, reopenBanner, setDeferredPrompt])

  const handleLauncherClick = useCallback(() => {
    if (!isIOSDevice && deferredPrompt) {
      void handleInstall()
      return
    }

    reopenBanner()
  }, [deferredPrompt, handleInstall, isIOSDevice, reopenBanner])

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.1 }}
          className="fixed bottom-24 left-4 right-4 z-[70] overflow-hidden rounded-2xl sm:bottom-24 sm:left-auto sm:right-4 sm:w-[380px]"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(20, 10, 30, 0.98) 40%, rgba(20, 10, 30, 0.98) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            boxShadow: '0 0 60px rgba(124, 58, 237, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Glow accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tutup banner"
          >
            <X className="size-3.5" />
          </button>

          <div className="px-5 py-4">
            <div className="flex items-start gap-4">
              {/* App Icon */}
              <div className="relative shrink-0 mt-0.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <img
                    src="/logo-sm.png"
                    alt="MG PRODUCTIONS"
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                  FREE
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-bold text-foreground">Install MG PRODUCTIONS</h3>
                  <Sparkles className="size-3.5 text-purple-400 shrink-0" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
                  Simpan aplikasi ke home screen atau desktop supaya akses toko lebih cepat dan terasa seperti app.
                </p>

                {isIOSDevice ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 shrink-0">
                        <Smartphone className="size-3.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground leading-tight">
                          Tap{' '}
                          <span className="inline-flex items-center">
                            <ArrowDownToLine className="size-3 mx-0.5 text-blue-400" />
                          </span>
                          {' '}di Safari, lalu pilih{' '}
                          <span className="font-semibold text-purple-300">Tambahkan ke Layar Utama</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={dismiss}
                      className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-all font-medium"
                    >
                      Mengerti
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleInstall}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="size-4" />
                    Install Sekarang
                  </motion.button>
                )}

                <div className="flex items-center justify-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                    <Monitor className="size-3" />
                    <span>Android & iOS</span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                    <Smartphone className="size-3" />
                    <span>Gratis</span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                    <Download className="size-3" />
                    <span>Installable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showLauncher && !appInstalled && !isStandalone && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          onClick={handleLauncherClick}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] left-4 z-[68] inline-flex h-12 w-12 items-center justify-center rounded-full border border-purple-400/25 bg-[rgba(18,12,34,0.92)] text-purple-100 shadow-lg shadow-purple-500/20 backdrop-blur-xl md:bottom-8"
          aria-label="Buka instal aplikasi"
        >
          <Download className="size-4 text-purple-300" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

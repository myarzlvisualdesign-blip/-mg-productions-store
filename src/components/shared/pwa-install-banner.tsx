'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Monitor, ArrowDownToLine, Sparkles, Chrome, Share2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// ─── Types ─────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

// ─── Helpers ────────────────────────────────────────────────────────────

function usePWAState() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [appInstalled, setAppInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showLauncher, setShowLauncher] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [referralOpen, setReferralOpen] = useState(false)
  const [stateHydrated, setStateHydrated] = useState(false)

  const isIOSDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isAndroidDevice = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem('mg-pwa-installed')

    setStateHydrated(true)
  }, [])

  const shouldHide = isStandalone || appInstalled || !showBanner || dismissed

  // Universal fallback: show banner after delay on any non-installed browser.
  useEffect(() => {
    if (!stateHydrated || isStandalone || dismissed) return

    const timer = setTimeout(() => {
      setShowBanner(true)
    }, 1800)
    return () => clearTimeout(timer)
  }, [dismissed, isStandalone, stateHydrated])

  // Android: capture beforeinstallprompt event
  useEffect(() => {
    if (!stateHydrated || isStandalone || isIOSDevice || dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => {
        setShowBanner(true)
      }, 1200)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed, isIOSDevice, isStandalone, stateHydrated])

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

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>
      setChatOpen(Boolean(customEvent.detail?.open))
    }

    window.addEventListener('mg-chat-visibility', handler as EventListener)
    return () => window.removeEventListener('mg-chat-visibility', handler as EventListener)
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>
      setReferralOpen(Boolean(customEvent.detail?.open))
    }

    window.addEventListener('mg-referral-visibility', handler as EventListener)
    return () =>
      window.removeEventListener('mg-referral-visibility', handler as EventListener)
  }, [])

  const dismiss = useCallback(() => {
    setShowBanner(false)
    setShowLauncher(true)
    setDismissed(true)
  }, [])

  const hideBanner = useCallback(() => {
    setShowBanner(false)
    setShowLauncher(false)
  }, [])

  const reopenBanner = useCallback(() => {
    setDismissed(false)
    setShowLauncher(false)
    setShowBanner(true)
  }, [])

  const showDownloadLauncher = useCallback(() => {
    setDismissed(true)
    setShowBanner(false)
    setShowLauncher(true)
  }, [])

  return {
    deferredPrompt,
    setDeferredPrompt,
    showBanner,
    showLauncher,
    appInstalled,
    chatOpen,
    referralOpen,
    isAndroidDevice,
    isIOSDevice,
    isStandalone,
    shouldHide,
    stateHydrated,
    dismiss,
    hideBanner,
    reopenBanner,
    showDownloadLauncher,
  }
}

// ─── Component ─────────────────────────────────────────────────────────

export default function PWAInstallBanner() {
  const [guideOpen, setGuideOpen] = useState(false)
  const {
    deferredPrompt,
    setDeferredPrompt,
    showLauncher,
    appInstalled,
    chatOpen,
    referralOpen,
    isAndroidDevice,
    isIOSDevice,
    isStandalone,
    shouldHide,
    stateHydrated,
    dismiss,
    hideBanner,
    reopenBanner,
    showDownloadLauncher,
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
    setGuideOpen(false)
    reopenBanner()
  }, [reopenBanner])

  const showManualInstallHint = !isIOSDevice && !deferredPrompt
  const guideTitle = isIOSDevice ? 'Cara Install di iPhone' : isAndroidDevice ? 'Cara Install di Android' : 'Cara Install di Desktop'
  const guideDescription = isIOSDevice
    ? 'Ikuti langkah ini di Safari agar MG PRODUCTIONS masuk ke Home Screen.'
    : isAndroidDevice
      ? 'Kalau tombol install otomatis tidak muncul, ikuti langkah ini di browser Android.'
      : 'Gunakan menu browser desktop untuk memasang MG PRODUCTIONS sebagai app.'
  const guideSteps = isIOSDevice
    ? [
        { title: 'Buka website di Safari', description: 'Pastikan halaman dibuka lewat Safari, bukan browser lain atau in-app browser.', icon: Smartphone },
        { title: 'Tekan tombol Share', description: 'Cari ikon bagikan di bagian bawah Safari.', icon: Share2 },
        { title: 'Pilih Add to Home Screen', description: 'Tekan Tambahkan ke Layar Utama, lalu konfirmasi Add.', icon: ArrowDownToLine },
      ]
    : isAndroidDevice
      ? [
          { title: 'Buka website di Chrome', description: 'Pastikan akses dari Chrome atau browser Android yang mendukung PWA.', icon: Chrome },
          { title: 'Tekan menu browser', description: 'Cari menu titik tiga di kanan atas browser.', icon: Monitor },
          { title: 'Pilih Install app', description: 'Kalau tidak ada, cari Tambahkan ke layar utama lalu konfirmasi Install.', icon: Download },
        ]
      : [
          { title: 'Buka menu browser', description: 'Di Chrome, Edge, atau browser desktop lain cari menu utama browser.', icon: Monitor },
          { title: 'Pilih Install App', description: 'Di beberapa browser namanya bisa Add to Dock atau Create Shortcut.', icon: Download },
          { title: 'Simpan dan buka', description: 'Setelah dipasang, MG PRODUCTIONS akan muncul seperti aplikasi biasa.', icon: Sparkles },
        ]

  const handleGuideOpenChange = useCallback((open: boolean) => {
    setGuideOpen(open)

    if (!open && !appInstalled && !isStandalone) {
      showDownloadLauncher()
    }
  }, [appInstalled, isStandalone, showDownloadLauncher])

  return (
    <AnimatePresence>
      {stateHydrated && !shouldHide && !guideOpen && !chatOpen && !referralOpen && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.1 }}
          className="store-install-banner fixed left-1/2 z-[70] w-[min(calc(100vw-1.5rem),24rem)] -translate-x-1/2 overflow-hidden rounded-2xl md:bottom-6 md:left-auto md:right-4 md:w-[22rem] md:translate-x-0"
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
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Tutup banner"
          >
            <X className="size-3.5" />
          </button>

          <div className="px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-start gap-3">
              {/* App Icon */}
              <div className="relative shrink-0 mt-0.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 shadow-lg shadow-purple-500/30 sm:h-14 sm:w-14">
                  <img
                    src="/logo-sm.png"
                    alt="MG PRODUCTIONS"
                    className="h-9 w-9 rounded-xl object-cover sm:h-11 sm:w-11"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                  FREE
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-[13px] font-bold text-foreground sm:text-sm">Install MG PRODUCTIONS</h3>
                  <Sparkles className="size-3.5 text-purple-400 shrink-0" />
                </div>
                <p className="mb-2.5 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                  Simpan aplikasi ke home screen atau desktop supaya akses toko lebih cepat dan terasa seperti app.
                </p>

                {isIOSDevice ? (
                  <div className="space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => {
                        hideBanner()
                        setGuideOpen(true)
                      }}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 sm:h-11"
                    >
                      <ArrowDownToLine className="size-4" />
                      Install Sekarang
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => {
                        hideBanner()
                        setGuideOpen(true)
                      }}
                      className="h-9 w-full rounded-xl border border-purple-400/18 bg-purple-500/10 text-xs font-medium text-purple-100 transition-all hover:bg-purple-500/15 sm:h-10"
                    >
                      Lihat Tutorial Install
                    </button>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                      iPhone tetap perlu langkah manual. Setelah tekan <span className="font-semibold text-purple-200">Install Sekarang</span>, ikuti tutorial Safari untuk <span className="font-semibold text-purple-200">Tambahkan ke Layar Utama</span>.
                    </div>
                    <button
                      onClick={dismiss}
                      className="h-9 w-full rounded-xl border border-white/[0.06] bg-white/5 text-xs font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground sm:h-10"
                    >
                      Mengerti
                    </button>
                  </div>
                ) : deferredPrompt ? (
                  <div className="space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleInstall}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 sm:h-11"
                    >
                      <Download className="size-4" />
                      Install Sekarang
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => {
                        hideBanner()
                        setGuideOpen(true)
                      }}
                      className="h-9 w-full rounded-xl border border-purple-400/18 bg-purple-500/10 text-xs font-medium text-purple-100 transition-all hover:bg-purple-500/15 sm:h-10"
                    >
                      Lihat Tutorial Install
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                      {isAndroidDevice ? (
                        <>
                          Di Android, kalau prompt belum muncul otomatis, buka menu browser lalu pilih <span className="font-semibold text-purple-200">Install app</span> atau <span className="font-semibold text-purple-200">Tambahkan ke layar utama</span>.
                        </>
                      ) : (
                        <>
                          Di browser desktop, buka menu browser lalu pilih <span className="font-semibold text-purple-200">Install App</span>, <span className="font-semibold text-purple-200">Add to Dock</span>, atau <span className="font-semibold text-purple-200">Create Shortcut</span>.
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        hideBanner()
                        setGuideOpen(true)
                      }}
                      className="h-9 w-full rounded-xl border border-purple-400/18 bg-purple-500/10 text-xs font-medium text-purple-100 transition-all hover:bg-purple-500/15 sm:h-10"
                    >
                      Lihat Tutorial Install
                    </button>
                    <button
                      onClick={dismiss}
                      className="h-9 w-full rounded-xl border border-white/[0.06] bg-white/5 text-xs font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground sm:h-10"
                    >
                      Mengerti
                    </button>
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-center gap-2.5 sm:mt-3 sm:gap-3">
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
                    <span>{showManualInstallHint ? 'Install Guide' : 'Installable'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {stateHydrated && showLauncher && !appInstalled && !isStandalone && !guideOpen && !chatOpen && !referralOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          onClick={handleLauncherClick}
          className="store-floating-button fixed left-4 z-[68] inline-flex h-12 w-12 items-center justify-center rounded-full border border-purple-400/25 bg-[rgba(18,12,34,0.92)] text-purple-100 shadow-lg shadow-purple-500/20 backdrop-blur-xl md:bottom-8"
          aria-label="Buka instal aplikasi"
        >
          <Download className="size-4 text-purple-300" />
        </motion.button>
      )}

      <Dialog open={guideOpen} onOpenChange={handleGuideOpenChange}>
        <DialogContent className="store-install-dialog top-auto translate-y-0 max-h-[min(78vh,680px)] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl border border-purple-400/15 bg-[rgba(12,8,22,0.98)] p-0 text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:top-[50%] sm:bottom-auto sm:max-w-lg sm:-translate-y-1/2" showCloseButton={false}>
          <div className="shrink-0 border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(124,58,237,0.22),rgba(18,12,34,0.94))] px-5 py-5">
            <button
              type="button"
              onClick={() => handleGuideOpenChange(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Tutup tutorial install"
            >
              <X className="size-4" />
            </button>
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-bold">{guideTitle}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {guideDescription}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="max-h-[calc(min(78vh,680px)-8.5rem)] overflow-y-auto overscroll-contain px-5 py-5 [-webkit-overflow-scrolling:touch]">
            <div className="space-y-3">
            {guideSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}

            <div className="rounded-2xl border border-purple-400/15 bg-purple-500/8 px-4 py-3 text-xs leading-relaxed text-purple-100/90">
              {isIOSDevice
                ? 'Catatan: iPhone memang tidak mengizinkan website menambahkan aplikasi ke Home Screen secara otomatis. User tetap perlu menekan tombol Add sendiri.'
                : isAndroidDevice
                  ? 'Catatan: di Android yang mendukung PWA, tombol Install Sekarang akan langsung memicu prompt install. Kalau prompt tidak muncul, gunakan tutorial di atas.'
                  : 'Catatan: nama menu install di desktop bisa sedikit berbeda tergantung browser yang dipakai user.'}
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}

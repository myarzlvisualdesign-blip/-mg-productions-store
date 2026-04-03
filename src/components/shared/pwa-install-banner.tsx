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
    setStateHydrated(true)
  }, [])

  const shouldHide = isStandalone || !showBanner || dismissed

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
      if (typeof window !== 'undefined' && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true)
      }
      setShowLauncher(false)
      setDismissed(false)
    }
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  useEffect(() => {
    if (!stateHydrated || isStandalone) return

    const reopen = () => {
      if (document.visibilityState === 'hidden') return

      setDismissed(false)
      setShowLauncher(false)
      setShowBanner(true)
    }

    window.addEventListener('pageshow', reopen)
    window.addEventListener('focus', reopen)
    document.addEventListener('visibilitychange', reopen)

    return () => {
      window.removeEventListener('pageshow', reopen)
      window.removeEventListener('focus', reopen)
      document.removeEventListener('visibilitychange', reopen)
    }
  }, [isStandalone, stateHydrated])

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

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ activeTab?: string }>

      if (customEvent.detail?.activeTab !== 'store' || isStandalone) {
        return
      }

      setDismissed(false)
      setShowLauncher(false)
      setShowBanner(true)
    }

    window.addEventListener('mg-store-tab-change', handler as EventListener)
    return () => window.removeEventListener('mg-store-tab-change', handler as EventListener)
  }, [isStandalone])

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

    if (!open && !isStandalone) {
      showDownloadLauncher()
    }
  }, [isStandalone, showDownloadLauncher])

  const tutorialCopy = isIOSDevice
    ? 'iPhone tetap perlu langkah manual. Setelah tekan Install Sekarang, ikuti tutorial Safari untuk Tambahkan ke Layar Utama.'
    : isAndroidDevice
      ? 'Android bisa install langsung jika prompt muncul. Kalau belum muncul, buka tutorial lalu pilih Install app atau Tambahkan ke layar utama.'
      : 'Desktop bisa install lewat menu browser. Kalau prompt belum muncul, buka tutorial lalu pilih Install App, Add to Dock, atau Create Shortcut.'

  return (
    <AnimatePresence>
      {stateHydrated && !shouldHide && !guideOpen && !chatOpen && !referralOpen && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.1 }}
          className="store-install-banner fixed left-1/2 z-[70] w-[min(calc(100vw-1.5rem),18.75rem)] -translate-x-1/2 overflow-hidden rounded-[1.3rem] md:bottom-6 md:left-auto md:right-4 md:w-[20.5rem] md:translate-x-0"
          style={{
            background: 'linear-gradient(180deg, rgba(50, 25, 77, 0.96) 0%, rgba(31, 16, 49, 0.98) 48%, rgba(24, 12, 37, 0.99) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(147, 91, 243, 0.24)',
            boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.07) inset, 0 18px 40px -18px rgba(0, 0, 0, 0.75), 0 0 42px rgba(124, 58, 237, 0.14)',
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/[0.03]" />

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Tutup banner"
          >
            <X className="size-3" />
          </button>

          <div className="px-3 py-3 sm:px-4 sm:py-3.5">
            <div className="flex items-start gap-2.75">
              {/* App Icon */}
              <div className="relative mt-0.5 shrink-0">
                <div className="flex h-[2.65rem] w-[2.65rem] items-center justify-center rounded-[0.95rem] bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-lg shadow-purple-500/30 sm:h-[2.8rem] sm:w-[2.8rem]">
                  <img
                    src="/logo-sm.png"
                    alt="MG PRODUCTIONS"
                    className="h-6 w-6 rounded-lg object-contain sm:h-7 sm:w-7"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[7px] font-bold text-white shadow-md">
                  FREE
                </div>
              </div>

              <div className="min-w-0 flex-1 pt-0.5 pr-7">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <h3 className="text-[12.5px] font-bold tracking-tight text-foreground sm:text-[14px]">Install MG PRODUCTIONS</h3>
                  <Sparkles className="size-3 shrink-0 text-purple-300" />
                </div>
                <p className="mb-2.5 max-w-[13rem] text-[10px] leading-relaxed text-white/58 sm:max-w-[14.75rem]">
                  Simpan aplikasi ke home screen atau desktop supaya akses toko lebih cepat dan terasa seperti app.
                </p>

                <div className="space-y-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      if (isIOSDevice) {
                        hideBanner()
                        setGuideOpen(true)
                        return
                      }

                      void handleInstall()
                    }}
                    className="flex h-[2.55rem] w-full items-center justify-center gap-2 rounded-[1rem] bg-gradient-to-r from-[#9325ff] via-[#cb3cff] to-[#ff4ba1] text-[12.5px] font-semibold text-white shadow-[0_12px_24px_rgba(168,85,247,0.22)] transition-all hover:brightness-110"
                  >
                    {isIOSDevice ? <ArrowDownToLine className="size-4" /> : <Download className="size-4" />}
                    Install Sekarang
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      hideBanner()
                      setGuideOpen(true)
                    }}
                    className="h-[2.5rem] w-full rounded-[1rem] border border-purple-400/18 bg-white/[0.03] text-[12.5px] font-medium text-white/88 transition-all hover:bg-white/[0.05]"
                  >
                    Lihat Tutorial Install
                  </button>
                  <div className="rounded-[1rem] border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-[10px] leading-relaxed text-white/68">
                    {tutorialCopy}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-1 text-[9px] text-white/35">
                    <Monitor className="size-3" />
                    <span>Android & iOS</span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center gap-1 text-[9px] text-white/35">
                    <Smartphone className="size-3" />
                    <span>Gratis</span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center gap-1 text-[9px] text-white/35">
                    <Download className="size-3" />
                    <span>Installable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {stateHydrated && showLauncher && !isStandalone && !guideOpen && !chatOpen && !referralOpen && (
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

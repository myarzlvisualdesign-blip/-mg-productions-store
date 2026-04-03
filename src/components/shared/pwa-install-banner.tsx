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

  const isIOSDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isAndroidDevice = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true)

  const shouldHide = isStandalone || appInstalled || !showBanner || dismissed

  // Universal fallback: show banner after delay on any non-installed browser.
  useEffect(() => {
    if (isStandalone || dismissed) return

    const timer = setTimeout(() => {
      setShowBanner(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [isStandalone, dismissed])

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

  return {
    deferredPrompt,
    setDeferredPrompt,
    showBanner,
    showLauncher,
    appInstalled,
    isAndroidDevice,
    isIOSDevice,
    isStandalone,
    shouldHide,
    dismiss,
    hideBanner,
    reopenBanner,
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
    isAndroidDevice,
    isIOSDevice,
    isStandalone,
    shouldHide,
    dismiss,
    hideBanner,
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

    hideBanner()
    setGuideOpen(true)
  }, [deferredPrompt, handleInstall, hideBanner, isIOSDevice])

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

  return (
    <AnimatePresence>
      {!shouldHide && !guideOpen && (
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
                      type="button"
                      onClick={() => {
                        hideBanner()
                        setGuideOpen(true)
                      }}
                      className="w-full h-10 rounded-xl border border-purple-400/18 bg-purple-500/10 text-xs font-medium text-purple-100 hover:bg-purple-500/15 transition-all"
                    >
                      Lihat Tutorial Install
                    </button>
                    <button
                      onClick={dismiss}
                      className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-all font-medium"
                    >
                      Mengerti
                    </button>
                  </div>
                ) : deferredPrompt ? (
                  <div className="space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleInstall}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
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
                      className="w-full h-10 rounded-xl border border-purple-400/18 bg-purple-500/10 text-xs font-medium text-purple-100 hover:bg-purple-500/15 transition-all"
                    >
                      Lihat Tutorial Install
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
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
                      className="w-full h-10 rounded-xl border border-purple-400/18 bg-purple-500/10 text-xs font-medium text-purple-100 hover:bg-purple-500/15 transition-all"
                    >
                      Lihat Tutorial Install
                    </button>
                    <button
                      onClick={dismiss}
                      className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground transition-all font-medium"
                    >
                      Mengerti
                    </button>
                  </div>
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
                    <span>{showManualInstallHint ? 'Install Guide' : 'Installable'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showLauncher && !appInstalled && !isStandalone && !guideOpen && (
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

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl border border-purple-400/15 bg-[rgba(12,8,22,0.98)] p-0 text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-w-lg" showCloseButton={false}>
          <div className="border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(124,58,237,0.22),rgba(18,12,34,0.94))] px-5 py-5">
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
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

          <div className="space-y-3 px-5 py-5">
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
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}

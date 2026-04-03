'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const SPLASH_KEY = 'mg_splash_shown'
const DURATION = 1600
const TICK_MS = 50

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(0)
  const dismissedRef = useRef(false)

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 600)
  }, [onComplete])

  useEffect(() => {
    if (exiting) return

    const start = Date.now()
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / DURATION) * 100)
      setProgress(pct)

      if (pct >= 100) {
        window.clearInterval(intervalId)
        dismiss()
      }
    }, TICK_MS)

    return () => window.clearInterval(intervalId)
  }, [exiting, dismiss])

  // Check if already shown this session
  useEffect(() => {
    requestAnimationFrame(() => {
      const shown = sessionStorage.getItem(SPLASH_KEY)
      if (shown) {
        dismiss()
        return
      }
      sessionStorage.setItem(SPLASH_KEY, '1')
    })
  }, [dismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0B0F] overflow-hidden"
          style={{ pointerEvents: exiting ? 'none' : 'auto' }}
        >
          {/* ── Aurora Background Blobs ────────────────────── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-purple-900/30 rounded-full aurora-blob-1" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-purple-700/20 rounded-full aurora-blob-2" />
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full aurora-blob-3" />
          </div>

          {/* ── Ambient Light ─────────────────────────────── */}
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-700/10 rounded-full blur-[120px] pointer-events-none" />

          {/* ── Center Content ─────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo */}
            <div className="relative group">
              {/* Golden Glow */}
              <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-2xl scale-125 splash-pulse-glow" />
              {/* Logo Frame */}
              <div
                className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center rounded-2xl border border-[#D4AF37]/20 shadow-[0_0_60px_rgba(212,175,55,0.1)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(212,175,55,0.08))',
                  backdropFilter: 'blur(24px)',
                }}
              >
                <img
                  alt="MG Productions"
                  src="/logo-sm.png"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </div>

            {/* Brand Text */}
            <div className="text-center space-y-2">
              <h1
                className="font-bold text-[#D4AF37] splash-premium-entrance"
                style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                  letterSpacing: '0.35rem',
                  textShadow: '0 0 20px rgba(212,175,55,0.35)',
                }}
              >
                MG PRODUCTIONS
              </h1>
              <p
                className="text-white/30 uppercase splash-fade-in-up"
                style={{
                  fontSize: 'clamp(0.55rem, 1.5vw, 0.7rem)',
                  letterSpacing: '0.25rem',
                  animationDelay: '1s',
                }}
              >
                MADE WITH CLICK COMPANY
              </p>
            </div>
          </div>

          {/* ── Bottom Loading Section ─────────────────────── */}
          <div className="absolute bottom-20 sm:bottom-24 flex flex-col items-center gap-4 w-full px-12 max-w-xs sm:max-w-sm" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center justify-between w-full">
              <span
                className="text-white/25 uppercase font-medium"
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.15rem',
                }}
              >
                INITIALISING ATELIER STUDIO
              </span>
              <span
                className="text-white/30 font-medium tabular-nums"
                style={{ fontSize: '0.6rem' }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            {/* Loading Track — driven by progress state */}
            <div className="w-full h-[1px] bg-white/10 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-none"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #D4AF37, #E8C547, #D4AF37)',
                  boxShadow: '0 0 12px rgba(212,175,55,0.6)',
                }}
              />
            </div>
          </div>

          {/* ── Decorative Corner Text ─────────────────────── */}
          <div className="absolute top-10 right-10 hidden sm:block">
            <p
              className="text-white/15 uppercase"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.4rem',
                transform: 'rotate(90deg)',
                transformOrigin: 'right center',
              }}
            >
              Est. MMXXIV
            </p>
          </div>

          {/* ── Fade-to-App Overlay ────────────────────────── */}
          {exiting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-[#0B0B0F]"
              style={{ zIndex: 1 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

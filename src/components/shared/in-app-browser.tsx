'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InAppBrowserProps {
  url: string
  title?: string
  open: boolean
  onClose: () => void
}

export default function InAppBrowser({ url, title, open, onClose }: InAppBrowserProps) {
  const [currentUrl, setCurrentUrl] = useState(url)
  const [inputUrl, setInputUrl] = useState(url)
  const [loading, setLoading] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  // Reset URL when prop changes — sync external prop to internal state
  useEffect(() => {
    if (url && open) {
      setCurrentUrl(url)
      setInputUrl(url)
      setIframeKey((k) => k + 1)
    }
  }, [url, open])

  const handleNavigate = useCallback((newUrl: string) => {
    let finalUrl = newUrl.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }
    setCurrentUrl(finalUrl)
    setInputUrl(finalUrl)
    setIframeKey((k) => k + 1)
    setLoading(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputUrl.trim()) handleNavigate(inputUrl)
  }

  const handleIframeLoad = () => {
    setLoading(false)
  }

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background"
        >
          {/* Top Bar */}
          <motion.div
            initial={{ y: -56 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' as const }}
            className="shrink-0 glass-card border-b border-white/[0.06] px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]"
          >
            <div className="flex items-center gap-2">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* URL Bar */}
              <form onSubmit={handleSubmit} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/5 border border-white/[0.06] focus-within:border-purple-500/30 transition-colors">
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <Input
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="h-full border-0 bg-transparent px-0 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0"
                    placeholder="Enter URL..."
                  />
                </div>
              </form>

              {/* Open in new tab */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenExternal}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg"
                title="Buka di tab baru"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Title bar */}
            {title && (
              <div className="mt-1.5 flex items-center justify-center">
                <p className="text-[11px] text-muted-foreground truncate max-w-xs">{title}</p>
              </div>
            )}
          </motion.div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex-1 relative"
          >
            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                    <p className="text-xs text-muted-foreground">Memuat halaman...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* iframe */}
            <iframe
              key={iframeKey}
              src={currentUrl}
              onLoad={handleIframeLoad}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              title={title || 'In-app browser'}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

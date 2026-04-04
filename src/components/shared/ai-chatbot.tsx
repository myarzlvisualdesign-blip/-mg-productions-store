'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribeLiveSync } from '@/lib/live-sync'
import { useLiveRefresh } from '@/hooks/use-live-refresh'

// ─── Types ───────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatbotSettings {
  name: string
  avatar: string
  welcomeMessage: string
  enabled: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderContent(content: string) {
  return content.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < content.split('\n').length - 1 && <br />}
    </span>
  ))
}

// ─── Default settings fallback ───────────────────────────────────────────

const DEFAULT_SETTINGS: ChatbotSettings = {
  name: 'MG Assistant',
  avatar: '',
  welcomeMessage: 'Halo! 👋 Saya asisten MG PRODUCTIONS. Ada yang bisa saya bantu hari ini?',
  enabled: true,
}

// ─── Quick Actions ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  'Produk apa saja yang tersedia?',
  'Cari produk kamera',
  'Info layanan Top Up',
  'Info layanan Travel',
]

// ─── Component ───────────────────────────────────────────────────────────

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<ChatbotSettings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [sessionId] = useState(() => generateSessionId())

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasAddedWelcome = useRef(false)

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/chatbot/settings?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!res.ok) {
        setSettings(DEFAULT_SETTINGS)
        return
      }

      const data = (await res.json()) as ChatbotSettings
      setSettings(data)

      setMessages((prev) => {
        const hasOnlyWelcome = prev.length === 1 && prev[0]?.id === 'welcome'
        if (!hasOnlyWelcome) return prev

        return [
          {
            ...prev[0],
            content: data.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
            timestamp: new Date(),
          },
        ]
      })

      if (data.enabled === false) {
        setIsOpen(false)
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setSettingsLoaded(true)
    }
  }, [])

  // ─── Fetch settings on mount ─────────────────────────────────────────
  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  useEffect(() => subscribeLiveSync(['chatbot-settings'], () => {
    void refreshSettings()
  }), [refreshSettings])

  useLiveRefresh(refreshSettings, {
    enabled: settingsLoaded,
    intervalMs: isOpen ? 12000 : 25000,
  })

  // ─── Auto-scroll to bottom ──────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // ─── Focus input when chat opens ────────────────────────────────────
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      void refreshSettings()
    }
  }, [isOpen, refreshSettings])

  // ─── Add welcome message on first open ──────────────────────────────
  useEffect(() => {
    if (isOpen && settings && !hasAddedWelcome.current && messages.length === 0) {
      hasAddedWelcome.current = true
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: settings.welcomeMessage,
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen, settings, messages.length])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('mg-chat-visibility', {
        detail: { open: isOpen },
      })
    )

    return () => {
      window.dispatchEvent(
        new CustomEvent('mg-chat-visibility', {
          detail: { open: false },
        })
      )
    }
  }, [isOpen])

  // ─── Send message ───────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/chatbot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            sessionId,
          }),
        })

        if (!res.ok) throw new Error('Request failed')

        const data = await res.json()

        const aiMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.response || data.message || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, aiMsg])
      } catch {
        const errorMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Maaf, saya sedang mengalami gangguan koneksi. Silakan coba lagi nanti.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, sessionId]
  )

  useEffect(() => {
    const handleServiceOrder = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>
      const message = customEvent.detail?.message?.trim()

      setIsOpen(true)

      if (message) {
        window.setTimeout(() => {
          void sendMessage(message)
        }, 160)
      }
    }

    window.addEventListener('mg-service-order', handleServiceOrder)
    return () => window.removeEventListener('mg-service-order', handleServiceOrder)
  }, [sendMessage])

  // ─── Submit handler ─────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // ─── Quick action handler ───────────────────────────────────────────
  const handleQuickAction = (action: string) => {
    sendMessage(action)
  }

  // ─── Don't render until settings are loaded ─────────────────────────
  if (!settingsLoaded) return null

  // ─── Don't render if chatbot is disabled ────────────────────────────
  if (settings && settings.enabled === false) return null

  const botName = settings?.name || DEFAULT_SETTINGS.name
  const botAvatar = settings?.avatar || DEFAULT_SETTINGS.avatar

  return (
    <>
      {/* ═══════════ Floating Action Button ═══════════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="store-floating-button fixed right-4 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/30 group hover:from-purple-400 hover:to-purple-600 md:bottom-8 md:right-5"
            aria-label="Buka AI Chat"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-purple-500/50 animate-ping" />
            <MessageCircle className="w-6 h-6 relative z-10 transition-transform group-hover:scale-110" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══════════ Chat Window ═══════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="store-floating-panel fixed right-4 left-4 z-50 flex h-[min(70vh,540px)] w-auto flex-col overflow-hidden rounded-2xl sm:left-auto sm:h-[500px] sm:w-96 md:bottom-8 md:right-5"
            style={{
              background: 'rgba(10, 6, 18, 0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* ─── Header ─────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  {botAvatar ? (
                    <img
                      src={botAvatar}
                      alt={botName}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">MG</span>
                    </div>
                  )}
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0612]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{botName}</h3>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    Online
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                aria-label="Tutup chat"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* ─── Messages Area ────────────────────────────── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(139, 92, 246, 0.3) transparent',
              }}
            >
              {/* Quick actions (show only on first message) */}
              {messages.length <= 1 && (
                <div className="space-y-2">
                  <div className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-3">
                    ✨ Ketik pertanyaan atau pilih di bawah
                  </div>
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleQuickAction(action)}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-purple-500/20 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {/* Message list */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI avatar */}
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 mt-0.5">
                      {botAvatar ? (
                        <img
                          src={botAvatar}
                          alt={botName}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600/60 to-purple-500/40 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-purple-200">MG</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className="max-w-[78%] flex flex-col">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : 'bg-purple-500/15 text-foreground/90 rounded-bl-sm border border-purple-500/10'
                      }`}
                    >
                      {renderContent(msg.content)}
                    </div>
                    <span
                      className={`text-[9px] text-muted-foreground/40 mt-1 px-1 ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="shrink-0 mt-0.5">
                    {botAvatar ? (
                      <img
                        src={botAvatar}
                        alt={botName}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600/60 to-purple-500/40 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-purple-200">MG</span>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-purple-500/15 border border-purple-500/10 rounded-bl-sm">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ─── Input Area ───────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="shrink-0 px-3 pb-3 pt-2 border-t border-white/[0.04]"
            >
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  disabled={isLoading}
                  className="flex-1 h-10 bg-white/[0.04] border-white/[0.06] text-sm placeholder:text-muted-foreground/40 focus:border-purple-500/30 rounded-xl"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25 disabled:opacity-40 transition-all"
                  aria-label="Kirim pesan"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground/30 text-center mt-1.5">
                Asisten katalog MG PRODUCTIONS
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

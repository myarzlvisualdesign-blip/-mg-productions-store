'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────

interface ReferralCodeInputProps {
  onApplyCode: (code: string, discount: number) => void
  onRemoveCode: () => void
  disabled?: boolean
}

// ─── Component ─────────────────────────────────────────────────────────

export default function ReferralCodeInput({ onApplyCode, onRemoveCode, disabled }: ReferralCodeInputProps) {
  const [inputCode, setInputCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [discount, setDiscount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [autoApplied, setAutoApplied] = useState(false)

  // ─── Auto-apply referral code from URL invite ─────────────────────
  useEffect(() => {
    if (autoApplied) return
    const inviteCode = localStorage.getItem('mg-referral-invite')
    if (!inviteCode || !inviteCode.startsWith('MG-')) return
    const code: string = inviteCode

    // Don't auto-apply if the user's own code is the same
    const myCode = localStorage.getItem('mg-referral-code')
    if (myCode === inviteCode) {
      localStorage.removeItem('mg-referral-invite')
      return
    }

    // Auto-apply the invite code
    async function autoApply() {
      setAutoApplied(true)
      setApplying(true)
      setError(null)

      try {
        const res = await fetch(`/api/referral/code?code=${encodeURIComponent(code)}`)
        if (res.ok) {
          setAppliedCode(code)
          setInputCode(code)
          // Fetch settings to get referee reward
          const settingsRes = await fetch('/api/referral/settings')
          let reward = 25000
          if (settingsRes.ok) {
            const settings = await settingsRes.json()
            reward = settings.refereeReward || 25000
          }
          setDiscount(reward)
          onApplyCode(code, reward)
          toast.success(`Kode referral ${code} otomatis diterapkan! Diskon ${formatRupiah(reward)}`)
          // Clean up the invite code from storage after applying
          localStorage.removeItem('mg-referral-invite')
        } else {
          localStorage.removeItem('mg-referral-invite')
        }
      } catch {
        localStorage.removeItem('mg-referral-invite')
      } finally {
        setApplying(false)
      }
    }
    autoApply()
  }, [autoApplied, onApplyCode])

  const handleApply = useCallback(async () => {
    const code = inputCode.trim().toUpperCase()
    if (!code) return

    setApplying(true)
    setError(null)

    try {
      const res = await fetch(`/api/referral/code?code=${encodeURIComponent(code)}`)
      if (res.ok) {
        const data = await res.json()
        setAppliedCode(code)
        // Fetch settings to get referee reward
        const settingsRes = await fetch('/api/referral/settings')
        let reward = 25000
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          reward = settings.refereeReward || 25000
        }
        setDiscount(reward)
        onApplyCode(code, reward)
        toast.success(`Kode referral diterapkan! Diskon ${formatRupiah(reward)}`)
      } else {
        const data = await res.json().catch(() => ({ error: 'Kode referral tidak valid' }))
        setError(data.error || 'Kode referral tidak valid')
      }
    } catch {
      setError('Gagal memvalidasi kode')
    } finally {
      setApplying(false)
    }
  }, [inputCode, onApplyCode])

  const handleRemove = () => {
    setAppliedCode(null)
    setDiscount(0)
    setInputCode('')
    setError(null)
    onRemoveCode()
  }

  // ─── Applied state (show badge) ─────────────────────────────────────
  if (appliedCode) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Tag className="size-3.5 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0 font-mono">
              {appliedCode}
            </Badge>
            <span className="text-[11px] text-emerald-400 font-medium">
              -{formatRupiah(discount)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Kode referral aktif</p>
        </div>
        <button
          onClick={handleRemove}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
          aria-label="Hapus kode referral"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  // ─── Input state ────────────────────────────────────────────────────
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Tag className="size-3.5 text-muted-foreground shrink-0" />
        <Input
          value={inputCode}
          onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setError(null) }}
          placeholder="Kode referral (opsional)"
          disabled={disabled || applying}
          className="flex-1 h-9 bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-lg text-xs font-mono uppercase"
          maxLength={12}
          autoComplete="off"
        />
        <Button
          size="sm"
          onClick={handleApply}
          disabled={disabled || applying || !inputCode.trim()}
          className="h-9 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs shrink-0"
        >
          {applying ? <Loader2 className="size-3.5 animate-spin" /> : 'Terapkan'}
        </Button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-red-400 pl-6"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hint */}
      {!error && !inputCode && (
        <p className="text-[10px] text-muted-foreground/40 pl-6">
          Berlaku untuk produk Store & Travel (min. {formatRupiah(100000)})
        </p>
      )}
    </div>
  )
}

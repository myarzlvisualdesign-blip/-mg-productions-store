'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Copy, Check, Tag, Users, Wallet, Loader2, ChevronRight, Sparkles, Landmark, ArrowDownToLine, Clock, CheckCircle2, XCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'
import ReferralShareSheet from '@/components/store/referral-share-sheet'

// ─── Types ─────────────────────────────────────────────────────────────

type Tab = 'my-code' | 'use-code' | 'withdraw'

interface ReferralCodeData {
  id: string
  code: string
  ownerName: string
  ownerEmail: string
  totalUsed: number
  totalReward: number
  totalWithdrawn: number
  balance: number
  active: boolean
}

interface ReferralSettingsData {
  enabled: boolean
  referrerReward: number
  refereeReward: number
  minOrderAmount: number
  minWithdraw: number
}

interface WithdrawalItem {
  id: string
  amount: number
  bankName: string
  bankAccount: string
  accountHolder: string
  status: string
  createdAt: string
}

// ─── Props ─────────────────────────────────────────────────────────────

interface ReferralDialogProps {
  open: boolean
  onClose: () => void
}

// ─── Component ─────────────────────────────────────────────────────────

export default function ReferralDialog({ open, onClose }: ReferralDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('my-code')
  const [settings, setSettings] = useState<ReferralSettingsData | null>(null)
  const [myCode, setMyCode] = useState<ReferralCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form state for creating code
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({})

  // Use code state
  const [inputCode, setInputCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [appliedResult, setAppliedResult] = useState<{ success: boolean; message: string } | null>(null)

  // Withdraw state
  const [wdAmount, setWdAmount] = useState('')
  const [wdBank, setWdBank] = useState('')
  const [wdAccount, setWdAccount] = useState('')
  const [wdHolder, setWdHolder] = useState('')
  const [wdSubmitting, setWdSubmitting] = useState(false)
  const [wdHistory, setWdHistory] = useState<WithdrawalItem[]>([])
  const [wdLoading, setWdLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // ─── Fetch settings & check existing code ────────────────────────────
  useEffect(() => {
    if (!open) return

    async function init() {
      setLoading(true)
      try {
        const settingsRes = await fetch('/api/referral/settings')
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data)
        }

        const savedCode = localStorage.getItem('mg-referral-code')
        if (savedCode) {
          const codeRes = await fetch(`/api/referral/code?code=${encodeURIComponent(savedCode)}`)
          if (codeRes.ok) {
            const fullCode = await codeRes.json()
            setMyCode(fullCode)
          } else {
            localStorage.removeItem('mg-referral-code')
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [open])

  // ─── Fetch withdrawal history when tab opens ─────────────────────────
  useEffect(() => {
    if (!open || activeTab !== 'withdraw' || !myCode) return

    async function fetchHistory() {
      setWdLoading(true)
      try {
        const res = await fetch(`/api/referral/withdraw?referralCodeId=${myCode!.id}`)
        if (res.ok) {
          const data = await res.json()
          setWdHistory(Array.isArray(data.withdrawals) ? data.withdrawals : [])
        }
      } catch {
        // Silent
      } finally {
        setWdLoading(false)
      }
    }
    fetchHistory()
  }, [open, activeTab, myCode])

  // ─── Refresh code data (after withdrawal) ────────────────────────────
  const refreshCodeData = useCallback(async () => {
    if (!myCode) return
    try {
      const savedCode = localStorage.getItem('mg-referral-code')
      if (!savedCode) return
      const codeRes = await fetch(`/api/referral/code?code=${encodeURIComponent(savedCode)}`)
      if (codeRes.ok) {
        const data = await codeRes.json()
        setMyCode(data)
      }
    } catch {
      // Silent
    }
  }, [myCode])

  // ─── Create referral code ───────────────────────────────────────────
  const handleCreateCode = useCallback(async () => {
    const errors: { name?: string; email?: string } = {}
    if (!ownerName.trim()) errors.name = 'Nama wajib diisi'
    if (!ownerEmail.trim()) errors.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) errors.email = 'Format email tidak valid'

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setCreating(true)
    try {
      const res = await fetch('/api/referral/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerName: ownerName.trim(), ownerEmail: ownerEmail.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Gagal membuat kode' }))
        throw new Error(data.error || 'Gagal membuat kode')
      }

      const data = await res.json()
      setMyCode(data)
      localStorage.setItem('mg-referral-code', data.code)
      toast.success('Kode referral berhasil dibuat!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat kode referral')
    } finally {
      setCreating(false)
    }
  }, [ownerName, ownerEmail])

  // ─── Copy code to clipboard ─────────────────────────────────────────
  const handleCopyCode = useCallback(async () => {
    if (!myCode) return
    try {
      await navigator.clipboard.writeText(myCode.code)
      setCopied(true)
      toast.success('Kode berhasil disalin!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin kode')
    }
  }, [myCode])

  // ─── Share code — open share sheet ─────────────────────────────────
  const handleShare = useCallback(() => {
    if (!myCode) return
    setShareOpen(true)
  }, [myCode])

  // ─── Apply a referral code (validate only) ──────────────────────────
  const handleApplyCode = useCallback(async () => {
    if (!inputCode.trim()) return
    setApplying(true)
    setAppliedResult(null)

    try {
      const res = await fetch(`/api/referral/code?code=${encodeURIComponent(inputCode.trim().toUpperCase())}`)
      if (res.ok) {
        setAppliedResult({
          success: true,
          message: `Kode valid! Kamu dapat diskon ${formatRupiah(settings?.refereeReward || 25000)} untuk pembelian Store atau Travel.`,
        })
        toast.success('Kode referral valid!')
      } else {
        const data = await res.json().catch(() => ({ error: 'Kode tidak valid' }))
        setAppliedResult({
          success: false,
          message: data.error || 'Kode referral tidak valid',
        })
      }
    } catch {
      setAppliedResult({ success: false, message: 'Gagal memvalidasi kode' })
    } finally {
      setApplying(false)
    }
  }, [inputCode, settings])

  // ─── Submit withdrawal ──────────────────────────────────────────────
  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(wdAmount)
    if (!myCode || !amount || amount <= 0) {
      toast.error('Jumlah pencairan tidak valid')
      return
    }
    if (!wdBank.trim() || !wdAccount.trim() || !wdHolder.trim()) {
      toast.error('Semua field bank wajib diisi')
      return
    }

    setWdSubmitting(true)
    try {
      const res = await fetch('/api/referral/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCodeId: myCode.id,
          amount,
          bankName: wdBank.trim(),
          bankAccount: wdAccount.trim(),
          accountHolder: wdHolder.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Gagal mengajukan pencairan' }))
        throw new Error(data.error || 'Gagal mengajukan pencairan')
      }

      toast.success('Permintaan pencairan berhasil diajukan! Admin akan memproses dalam 1x24 jam.')
      setWdAmount('')
      setWdBank('')
      setWdAccount('')
      setWdHolder('')
      refreshCodeData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengajukan pencairan')
    } finally {
      setWdSubmitting(false)
    }
  }, [myCode, wdAmount, wdBank, wdAccount, wdHolder, refreshCodeData])

  // ─── Reset states on close ──────────────────────────────────────────
  const handleClose = () => {
    setAppliedResult(null)
    setInputCode('')
    onClose()
  }

  // ─── Helpers ─────────────────────────────────────────────────────────
  const balance = myCode ? (myCode.balance ?? myCode.totalReward - (myCode.totalWithdrawn || 0)) : 0
  const minWithdraw = settings?.minWithdraw || 100000
  const dialogClassName = "!left-1/2 !top-1/2 !grid !w-[calc(100%-1rem)] !max-w-[34rem] !translate-x-[-50%] !translate-y-[-50%] !gap-0 !overflow-hidden rounded-3xl border border-white/10 bg-background/95 p-0 shadow-2xl shadow-black/40 backdrop-blur-xl !max-h-[min(90vh,calc(100dvh-1rem))] sm:!w-[calc(100%-2rem)] lg:!max-w-xl"

  const statusLabel = (s: string) => {
    switch (s) {
      case 'pending': return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[9px]"><Clock className="size-2.5 mr-0.5" />Menunggu</Badge>
      case 'approved': return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[9px]">Disetujui</Badge>
      case 'paid': return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[9px]"><CheckCircle2 className="size-2.5 mr-0.5" />Dibayar</Badge>
      case 'rejected': return <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[9px]"><XCircle className="size-2.5 mr-0.5" />Ditolak</Badge>
      default: return <Badge className="text-[9px]">{s}</Badge>
    }
  }

  // ─── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className={dialogClassName}>
          <DialogTitle className="sr-only">Referral Program</DialogTitle>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-12">
            <Loader2 className="size-8 text-purple-400 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (settings && !settings.enabled) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className={dialogClassName}>
          <DialogTitle className="sr-only">Program Referral</DialogTitle>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8">
            <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Gift className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Program Referral</h3>
            <p className="text-sm text-muted-foreground mt-2">Saat ini program referral sedang tidak aktif. Coba lagi nanti!</p>
            <Button onClick={handleClose} className="mt-6 rounded-xl">Tutup</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className={dialogClassName}>
        <div className="flex min-h-0 flex-1 flex-col">
          {/* ─── Header ──────────────────────────────────────────────── */}
          <div className="shrink-0 border-b border-white/[0.06] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-10 text-lg">
                <Gift className="size-5 text-purple-400" />
                Referral Program
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Ajak teman belanja & dapatkan reward!
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
            <div className="space-y-4">
              {/* ─── Info Banner ─────────────────────────────────────────── */}
              <div className="rounded-xl border border-purple-500/15 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-400" />
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">Berlaku untuk Produk Store & Travel</p>
                    <p className="mt-0.5">
                      Referrer dapat <span className="font-semibold text-purple-400">{formatRupiah(settings?.referrerReward || 50000)}</span> •
                      Referee diskon <span className="font-semibold text-purple-400">{formatRupiah(settings?.refereeReward || 25000)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── Tab Switcher ────────────────────────────────────────── */}
              <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
                <button
                  onClick={() => setActiveTab('my-code')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    activeTab === 'my-code' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Tag className="size-3" /> Kode Saya
                </button>
                <button
                  onClick={() => setActiveTab('use-code')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    activeTab === 'use-code' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Gift className="size-3" /> Pakai Kode
                </button>
                {myCode && (
                  <button
                    onClick={() => setActiveTab('withdraw')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                      activeTab === 'withdraw' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Landmark className="size-3" /> Tarik Dana
                  </button>
                )}
              </div>

              {/* ─── Tab Content ─────────────────────────────────────────── */}
              <AnimatePresence mode="wait">
                {activeTab === 'my-code' && (
                  <motion.div key="my-code" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                    {myCode ? (
                      <div className="space-y-4">
                  {/* Code Display Card */}
                        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-600/15 to-indigo-600/10 p-5 text-center">
                          <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground/60">Kode Referral Kamu</p>
                          <code className="gradient-text text-2xl font-mono font-bold tracking-wider sm:text-3xl">{myCode.code}</code>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <Button size="sm" onClick={handleCopyCode} className="gap-1.5 rounded-lg border border-white/10 bg-white/10 text-xs hover:bg-white/15">
                              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                              {copied ? 'Disalin!' : 'Salin'}
                            </Button>
                            <Button size="sm" onClick={handleShare} className="gap-1.5 rounded-lg bg-purple-600 text-xs text-white hover:bg-purple-500">
                              <Share2 className="size-3.5" />
                              Bagikan
                            </Button>
                          </div>
                        </div>

                  {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="glass-card rounded-xl p-3 text-center">
                            <Users className="mx-auto mb-1 size-4 text-purple-400" />
                            <p className="text-base font-bold text-foreground">{myCode.totalUsed}</p>
                            <p className="text-[9px] text-muted-foreground">Dipakai</p>
                          </div>
                          <div className="glass-card rounded-xl p-3 text-center">
                            <Wallet className="mx-auto mb-1 size-4 text-emerald-400" />
                            <p className="text-base font-bold text-foreground">{formatRupiah(myCode.totalReward)}</p>
                            <p className="text-[9px] text-muted-foreground">Total</p>
                          </div>
                          <div className="glass-card rounded-xl border-emerald-500/15 p-3 text-center">
                            <Landmark className="mx-auto mb-1 size-4 text-amber-400" />
                            <p className="text-base font-bold text-emerald-400">{formatRupiah(balance)}</p>
                            <p className="text-[9px] text-muted-foreground">Saldo</p>
                          </div>
                        </div>

                        <p className="text-center text-[10px] leading-relaxed text-muted-foreground/60">
                          Bagikan kode ke teman. Setiap teman belanja <span className="text-foreground">Store</span> atau <span className="text-foreground">Travel</span>, kamu dapat {formatRupiah(settings?.referrerReward || 50000)}!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                            <Tag className="size-8 text-purple-400" />
                          </div>
                          <p className="text-sm text-muted-foreground">Buat kode referral dan mulai dapatkan reward!</p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="ref-name" className="text-sm">Nama Lengkap</Label>
                            <Input id="ref-name" value={ownerName} onChange={(e) => { setOwnerName(e.target.value); setFormErrors((p) => ({ ...p, name: undefined })) }} placeholder="John Doe" className={`h-10 rounded-xl border-white/[0.06] bg-white/[0.03] text-sm focus:border-purple-500/30 ${formErrors.name ? 'border-red-500/50' : ''}`} />
                            {formErrors.name && <p className="text-[10px] text-red-400">{formErrors.name}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="ref-email" className="text-sm">Email</Label>
                            <Input id="ref-email" type="email" value={ownerEmail} onChange={(e) => { setOwnerEmail(e.target.value); setFormErrors((p) => ({ ...p, email: undefined })) }} placeholder="john@example.com" className={`h-10 rounded-xl border-white/[0.06] bg-white/[0.03] text-sm focus:border-purple-500/30 ${formErrors.email ? 'border-red-500/50' : ''}`} />
                            {formErrors.email && <p className="text-[10px] text-red-400">{formErrors.email}</p>}
                          </div>
                        </div>
                        <Button onClick={handleCreateCode} disabled={creating} className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500">
                          {creating ? <><Loader2 className="mr-2 size-4 animate-spin" />Membuat...</> : <>Buat Kode Referral <ChevronRight className="ml-1 size-4" /></>}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'use-code' && (
                  <motion.div key="use-code" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                          <Gift className="size-8 text-emerald-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">Punya kode referral? Masukkan untuk dapatkan diskon!</p>
                      </div>
                      <div className="flex gap-2">
                        <Input value={inputCode} onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setAppliedResult(null) }} placeholder="Contoh: MG-A3K9X2" className="h-10 flex-1 rounded-xl border-white/[0.06] bg-white/[0.03] text-sm font-mono uppercase focus:border-purple-500/30" maxLength={12} autoComplete="off" />
                        <Button onClick={handleApplyCode} disabled={applying || !inputCode.trim()} className="h-10 shrink-0 rounded-xl bg-purple-600 px-5 text-white hover:bg-purple-500">
                          {applying ? <Loader2 className="size-4 animate-spin" /> : 'Terapkan'}
                        </Button>
                      </div>
                      <AnimatePresence>
                        {appliedResult && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`rounded-xl p-3 text-xs leading-relaxed ${appliedResult.success ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border border-red-500/20 bg-red-500/10 text-red-300'}`}>
                            {appliedResult.message}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {!appliedResult && (
                        <p className="text-center text-[10px] text-muted-foreground/60">
                          Berlaku untuk <span className="text-foreground">Store</span> & <span className="text-foreground">Travel</span> dengan min. {formatRupiah(settings?.minOrderAmount || 100000)}.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'withdraw' && myCode && (
                  <motion.div key="withdraw" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                    <div className="space-y-4">
                {/* Balance Card */}
                      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/15 to-emerald-400/5 p-4 text-center">
                        <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60">Saldo Tersedia</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatRupiah(balance)}</p>
                        {balance < minWithdraw && (
                          <p className="mt-1 text-[10px] text-amber-400">
                            Belum mencapai minimum pencairan {formatRupiah(minWithdraw)}
                          </p>
                        )}
                      </div>

                {/* Withdrawal Form */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Jumlah Pencairan (Rp)</Label>
                          <Input type="number" value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} placeholder={String(minWithdraw)} className="h-10 rounded-xl border-white/[0.06] bg-white/[0.03] text-sm focus:border-purple-500/30" min={0} />
                        </div>
                        <Separator className="bg-white/[0.04]" />
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nama Bank</Label>
                          <Input value={wdBank} onChange={(e) => setWdBank(e.target.value)} placeholder="BCA, Mandiri, BNI, BRI, dll" className="h-10 rounded-xl border-white/[0.06] bg-white/[0.03] text-sm focus:border-purple-500/30" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nomor Rekening</Label>
                          <Input value={wdAccount} onChange={(e) => setWdAccount(e.target.value)} placeholder="1234567890" className="h-10 rounded-xl border-white/[0.06] bg-white/[0.03] text-sm font-mono focus:border-purple-500/30" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nama Pemilik Rekening</Label>
                          <Input value={wdHolder} onChange={(e) => setWdHolder(e.target.value)} placeholder="Nama sesuai buku rekening" className="h-10 rounded-xl border-white/[0.06] bg-white/[0.03] text-sm focus:border-purple-500/30" />
                        </div>
                      </div>

                      <Button onClick={handleWithdraw} disabled={wdSubmitting || balance < minWithdraw} className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40">
                        {wdSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" />Mengajukan...</> : <><ArrowDownToLine className="mr-2 size-4" />Ajukan Pencairan</>}
                      </Button>

                      <p className="text-center text-[9px] text-muted-foreground/50">
                        Min. pencairan {formatRupiah(minWithdraw)} • Proses 1x24 jam
                      </p>

                {/* History */}
                      <Separator className="bg-white/[0.04]" />
                      <p className="text-xs font-medium text-muted-foreground">Riwayat Pencairan</p>

                      {wdLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : wdHistory.length === 0 ? (
                        <p className="py-4 text-center text-[11px] text-muted-foreground/50">Belum ada riwayat pencairan</p>
                      ) : (
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                          {wdHistory.map((wd) => (
                            <div key={wd.id} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold text-foreground">{formatRupiah(wd.amount)}</p>
                                  {statusLabel(wd.status)}
                                </div>
                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground/60">{wd.bankName} • {wd.bankAccount}</p>
                              </div>
                              <p className="ml-2 shrink-0 text-[9px] text-muted-foreground/40">
                                {new Date(wd.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Share Sheet */}
      <ReferralShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        code={myCode?.code || ''}
        refereeReward={settings?.refereeReward || 25000}
      />
    </Dialog>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Landmark,
  ArrowDownToLine,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────

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

interface WithdrawalItem {
  id: string
  amount: number
  bankName: string
  bankAccount: string
  accountHolder: string
  status: string
  adminNote: string
  createdAt: string
}

interface ReferralWithdrawTabProps {
  code: string
}

// ─── Constants ─────────────────────────────────────────────────────────

const BANK_OPTIONS = [
  'BCA',
  'BRI',
  'Mandiri',
  'BNI',
  'BSI',
  'Danamon',
  'Permata',
  'CIMB',
  'Lainnya',
]

const MIN_WITHDRAW = 100000

const QUICK_AMOUNTS = [
  { label: 'Rp 100K', value: 100000 },
  { label: 'Rp 200K', value: 200000 },
  { label: 'Rp 500K', value: 500000 },
]

// ─── Component ─────────────────────────────────────────────────────────

export default function ReferralWithdrawTab({ code }: ReferralWithdrawTabProps) {
  const [codeData, setCodeData] = useState<ReferralCodeData | null>(null)
  const [history, setHistory] = useState<WithdrawalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  // ─── Fetch data on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [codeRes, historyRes] = await Promise.all([
          fetch(`/api/referral/code?code=${encodeURIComponent(code)}`),
          fetch(`/api/referral/withdraw?code=${encodeURIComponent(code)}`),
        ])

        if (codeRes.ok) {
          const data = await codeRes.json()
          setCodeData(data)
        }

        if (historyRes.ok) {
          const data = await historyRes.json()
          setHistory(Array.isArray(data) ? data : [])
        }
      } catch {
        toast.error('Gagal memuat data pencairan')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [code])

  // ─── Refresh code data ───────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    try {
      const [codeRes, historyRes] = await Promise.all([
        fetch(`/api/referral/code?code=${encodeURIComponent(code)}`),
        fetch(`/api/referral/withdraw?code=${encodeURIComponent(code)}`),
      ])

      if (codeRes.ok) {
        const data = await codeRes.json()
        setCodeData(data)
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(Array.isArray(data) ? data : [])
      }
    } catch {
      // Silent
    }
  }, [code])

  // ─── Submit withdrawal ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount)

    // Validation
    if (!numAmount || numAmount <= 0) {
      toast.error('Jumlah pencairan tidak valid')
      return
    }
    if (numAmount < MIN_WITHDRAW) {
      toast.error(`Minimum pencairan ${formatRupiah(MIN_WITHDRAW)}`)
      return
    }
    if (codeData && numAmount > (codeData.balance ?? codeData.totalReward - codeData.totalWithdrawn)) {
      toast.error('Saldo tidak mencukupi')
      return
    }
    if (!bankName) {
      toast.error('Pilih nama bank')
      return
    }
    if (!bankAccount.trim()) {
      toast.error('Nomor rekening wajib diisi')
      return
    }
    if (!/^\d+$/.test(bankAccount.trim())) {
      toast.error('Nomor rekening hanya boleh berisi angka')
      return
    }
    if (!accountHolder.trim()) {
      toast.error('Nama pemilik rekening wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/referral/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          amount: numAmount,
          bankName,
          bankAccount: bankAccount.trim(),
          accountHolder: accountHolder.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Gagal mengajukan pencairan' }))
        throw new Error(data.error || 'Gagal mengajukan pencairan')
      }

      toast.success('Permintaan pencairan berhasil diajukan! Admin akan memproses dalam 1x24 jam.')
      setAmount('')
      setBankName('')
      setBankAccount('')
      setAccountHolder('')
      refreshData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengajukan pencairan')
    } finally {
      setSubmitting(false)
    }
  }, [amount, bankName, bankAccount, accountHolder, code, codeData, refreshData])

  // ─── Helpers ─────────────────────────────────────────────────────────
  const availableBalance = codeData
    ? (codeData.balance ?? codeData.totalReward - codeData.totalWithdrawn)
    : 0
  const totalEarned = codeData?.totalReward ?? 0
  const totalWithdrawn = codeData?.totalWithdrawn ?? 0

  const setQuickAmount = (value: number | 'all') => {
    if (value === 'all') {
      setAmount(String(Math.floor(availableBalance)))
    } else {
      setAmount(String(value))
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[9px]">
            <Clock className="size-2.5 mr-0.5" />Menunggu
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[9px]">
            Disetujui
          </Badge>
        )
      case 'paid':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[9px]">
            <CheckCircle2 className="size-2.5 mr-0.5" />Dibayar
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[9px]">
            <XCircle className="size-2.5 mr-0.5" />Ditolak
          </Badge>
        )
      default:
        return <Badge className="text-[9px]">{status}</Badge>
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* ─── Balance Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl glass-card text-center">
          <Wallet className="size-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-emerald-400">{formatRupiah(availableBalance)}</p>
          <p className="text-[9px] text-muted-foreground">Saldo</p>
        </div>
        <div className="p-3 rounded-xl glass-card text-center">
          <TrendingUp className="size-4 text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">{formatRupiah(totalEarned)}</p>
          <p className="text-[9px] text-muted-foreground">Total Dapat</p>
        </div>
        <div className="p-3 rounded-xl glass-card text-center">
          <Landmark className="size-4 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground">{formatRupiah(totalWithdrawn)}</p>
          <p className="text-[9px] text-muted-foreground">Tarik</p>
        </div>
      </div>

      {/* ─── Withdraw Form ─────────────────────────────────────────── */}
      {availableBalance > 0 && (
        <div className="space-y-3">
          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Jumlah Pencairan</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min. ${formatRupiah(MIN_WITHDRAW)}`}
              className="h-10 bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl text-sm"
              min={0}
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa.value}
                onClick={() => setQuickAmount(qa.value)}
                disabled={qa.value > availableBalance}
                className={`px-2.5 py-1.5 text-[10px] font-medium rounded-lg transition-all ${
                  parseFloat(amount) === qa.value
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {qa.label}
              </button>
            ))}
            <button
              onClick={() => setQuickAmount('all')}
              disabled={availableBalance < MIN_WITHDRAW}
              className={`px-2.5 py-1.5 text-[10px] font-medium rounded-lg transition-all ${
                amount === String(Math.floor(availableBalance)) && availableBalance >= MIN_WITHDRAW
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Semua
            </button>
          </div>

          <Separator className="bg-white/[0.04]" />

          {/* Bank Select */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nama Bank</Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger className="w-full h-10 bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl text-sm">
                <SelectValue placeholder="Pilih bank" />
              </SelectTrigger>
              <SelectContent>
                {BANK_OPTIONS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Number */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nomor Rekening</Label>
            <Input
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890"
              className="h-10 bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl text-sm font-mono"
              inputMode="numeric"
            />
          </div>

          {/* Account Holder */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nama Pemilik Rekening</Label>
            <Input
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Nama sesuai buku rekening"
              className="h-10 bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl text-sm"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || availableBalance < MIN_WITHDRAW}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-40"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Mengajukan...
              </>
            ) : (
              <>
                <ArrowDownToLine className="size-4 mr-2" />
                Ajukan Pencairan
              </>
            )}
          </Button>

          <p className="text-[9px] text-muted-foreground/50 text-center">
            Min. pencairan {formatRupiah(MIN_WITHDRAW)} &bull; Proses 1x24 jam
          </p>
        </div>
      )}

      {availableBalance > 0 && availableBalance < MIN_WITHDRAW && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-xs text-amber-400">
            Belum mencapai minimum pencairan {formatRupiah(MIN_WITHDRAW)}
          </p>
        </div>
      )}

      {/* ─── History ───────────────────────────────────────────────── */}
      <Separator className="bg-white/[0.04]" />
      <p className="text-xs font-medium text-muted-foreground">Riwayat Pencairan</p>

      {history.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/50 text-center py-4">
          Belum ada riwayat pencairan
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence>
            {history.map((wd) => (
              <motion.div
                key={wd.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{formatRupiah(wd.amount)}</p>
                    {statusBadge(wd.status)}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                    {wd.bankName} &bull; {wd.bankAccount}
                  </p>
                  {wd.status === 'rejected' && wd.adminNote && (
                    <p className="text-[10px] text-red-400/80 mt-0.5 truncate">
                      Alasan: {wd.adminNote}
                    </p>
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground/40 shrink-0 ml-2">
                  {new Date(wd.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

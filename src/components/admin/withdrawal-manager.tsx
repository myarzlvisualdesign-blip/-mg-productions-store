'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Check,
  X,
  Banknote,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────

interface WithdrawalRow {
  id: string
  amount: number
  bankName: string
  bankAccount: string
  accountHolder: string
  status: string
  adminNote: string
  createdAt: string
  referralCode: {
    code: string
    ownerName: string
    ownerEmail: string
  }
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'paid' | 'rejected'

// ─── Constants ─────────────────────────────────────────────────────────

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Dibayar', value: 'paid' },
  { label: 'Ditolak', value: 'rejected' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  pending: 'bg-amber-400',
  approved: 'bg-blue-400',
  paid: 'bg-emerald-400',
  rejected: 'bg-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Disetujui',
  paid: 'Dibayar',
  rejected: 'Ditolak',
}

// ─── Component ─────────────────────────────────────────────────────────

export default function WithdrawalManager() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Reject state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  // ─── Fetch data ─────────────────────────────────────────────────────
  const fetchWithdrawals = useCallback(async () => {
    setLoading(true)
    try {
      const queryParam = filter === 'all' ? '' : `?status=${filter}`
      const res = await fetch(`/api/referral/withdrawals-admin${queryParam}`)
      if (res.ok) {
        const data = await res.json()
        setWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : [])
      }
    } catch {
      toast.error('Gagal memuat data pencairan')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchWithdrawals()
  }, [fetchWithdrawals])

  // ─── Update withdrawal status ───────────────────────────────────────
  const handleUpdateStatus = useCallback(
    async (id: string, status: string, adminNote?: string) => {
      setUpdating(id)
      try {
        const res = await fetch('/api/referral/withdrawals-admin', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status, adminNote: adminNote || undefined }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Gagal mengupdate' }))
          throw new Error(data.error || 'Gagal mengupdate status')
        }

        toast.success(`Status berhasil diubah ke ${STATUS_LABELS[status] || status}`)
        setRejectingId(null)
        setRejectNote('')
        fetchWithdrawals()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal mengupdate status')
      } finally {
        setUpdating(null)
      }
    },
    [fetchWithdrawals]
  )

  const handleReject = useCallback(
    (id: string) => {
      if (!rejectNote.trim()) {
        toast.error('Catatan penolakan wajib diisi')
        return
      }
      handleUpdateStatus(id, 'rejected', rejectNote.trim())
    },
    [rejectNote, handleUpdateStatus]
  )

  // ─── Computed ───────────────────────────────────────────────────────
  const filteredList = filter === 'all'
    ? withdrawals
    : withdrawals.filter((w) => w.status === filter)

  const pendingItems = withdrawals.filter((w) => w.status === 'pending')
  const approvedItems = withdrawals.filter((w) => w.status === 'approved')
  const paidItems = withdrawals.filter((w) => w.status === 'paid')

  const totalPendingAmount = pendingItems.reduce((sum, w) => sum + w.amount, 0)
  const totalApprovedAmount = approvedItems.reduce((sum, w) => sum + w.amount, 0)
  const totalPaidCount = paidItems.length

  const maskAccount = (account: string) => {
    if (account.length <= 4) return account
    return '****' + account.slice(-4)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    show: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.03, duration: 0.3 },
    }),
  }

  // ─── Loading skeleton ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/5 mb-4" />
        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl p-6"
    >
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          <span className="gradient-text">Pencairan</span> Referral
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchWithdrawals}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* ─── Filter Tabs ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((fo) => (
          <button
            key={fo.value}
            onClick={() => setFilter(fo.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
              filter === fo.value
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'
            }`}
          >
            {fo.label}
          </button>
        ))}
      </div>

      {/* ─── Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600/15 to-amber-400/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-4 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">Pending</span>
          </div>
          <p className="text-base font-bold text-amber-400">{formatRupiah(totalPendingAmount)}</p>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">{pendingItems.length} permintaan</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/15 to-blue-400/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-4 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">Disetujui</span>
          </div>
          <p className="text-base font-bold text-blue-400">{formatRupiah(totalApprovedAmount)}</p>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">{approvedItems.length} permintaan</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-600/15 to-emerald-400/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="size-4 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">Dibayar</span>
          </div>
          <p className="text-base font-bold text-emerald-400">{totalPaidCount}</p>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">pencairan selesai</p>
        </div>
      </div>

      <Separator className="bg-white/[0.04] mb-4" />

      {/* ─── Table ────────────────────────────────────────────────── */}
      <div className="max-h-[500px] overflow-y-auto rounded-xl border border-white/[0.06]">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
            <tr className="border-white/[0.06]">
              <th className="text-left text-muted-foreground font-medium text-xs px-4 py-3">Tanggal</th>
              <th className="text-left text-muted-foreground font-medium text-xs px-4 py-3">Kode Referral</th>
              <th className="text-left text-muted-foreground font-medium text-xs px-4 py-3">Pemilik</th>
              <th className="text-left text-muted-foreground font-medium text-xs px-4 py-3">Bank</th>
              <th className="text-right text-muted-foreground font-medium text-xs px-4 py-3">Jumlah</th>
              <th className="text-center text-muted-foreground font-medium text-xs px-4 py-3">Status</th>
              <th className="text-center text-muted-foreground font-medium text-xs px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                    Belum ada data pencairan
                  </td>
                </tr>
              ) : (
                filteredList.map((wd, i) => (
                  <motion.tr
                    key={wd.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    className="border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Tanggal */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(wd.createdAt)}
                    </td>

                    {/* Kode Referral */}
                    <td className="px-4 py-3">
                      <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px] font-mono">
                        {wd.referralCode?.code || '-'}
                      </Badge>
                    </td>

                    {/* Pemilik */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {wd.referralCode?.ownerName || '-'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {wd.referralCode?.ownerEmail || '-'}
                        </p>
                      </div>
                    </td>

                    {/* Bank */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs text-foreground">{wd.bankName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {maskAccount(wd.bankAccount)}
                        </p>
                      </div>
                    </td>

                    {/* Jumlah */}
                    <td className="px-4 py-3 text-xs font-semibold text-foreground text-right whitespace-nowrap">
                      {formatRupiah(wd.amount)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`${STATUS_COLORS[wd.status] || ''} border text-[10px] px-2 py-0.5 font-medium`}
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[wd.status] || ''}`}
                        />
                        {STATUS_LABELS[wd.status] || wd.status}
                      </Badge>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 text-center">
                      {updating === wd.id ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="size-4 text-muted-foreground animate-spin" />
                        </div>
                      ) : rejectingId === wd.id ? (
                        /* ── Inline Reject Form ─────────────────── */
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Alasan..."
                            className="h-7 w-28 bg-white/[0.03] border-white/[0.06] focus:border-red-500/30 rounded-lg text-[10px]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleReject(wd.id)
                              if (e.key === 'Escape') {
                                setRejectingId(null)
                                setRejectNote('')
                              }
                            }}
                          />
                          <button
                            onClick={() => handleReject(wd.id)}
                            className="p-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                            title="Konfirmasi tolak"
                          >
                            <Send className="size-3" />
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null)
                              setRejectNote('')
                            }}
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
                            title="Batal"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : wd.status === 'pending' ? (
                        /* ── Pending Actions ────────────────────── */
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(wd.id, 'approved')}
                            className="px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 transition-all"
                            title="Setujui"
                          >
                            <Check className="size-3 mr-0.5 inline" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(wd.id)
                              setRejectNote('')
                            }}
                            className="px-2 py-1 text-[10px] font-medium rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 transition-all"
                            title="Tolak"
                          >
                            <X className="size-3 mr-0.5 inline" />
                            Reject
                          </button>
                        </div>
                      ) : wd.status === 'approved' ? (
                        /* ── Approved Action ────────────────────── */
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleUpdateStatus(wd.id, 'paid')}
                            className="px-2 py-1 text-[10px] font-medium rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 transition-all"
                            title="Tandai dibayar"
                          >
                            <Banknote className="size-3 mr-0.5 inline" />
                            Mark Paid
                          </button>
                        </div>
                      ) : (
                        /* ── No Actions for Rejected/Paid ──────── */
                        <span className="text-[10px] text-muted-foreground/40">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ─── Footer note ─────────────────────────────────────────── */}
      {filteredList.length > 0 && (
        <p className="text-[10px] text-muted-foreground/40 text-center mt-4">
          Menampilkan {filteredList.length} data pencairan
        </p>
      )}
    </motion.div>
  )
}

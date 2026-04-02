'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2, Gift, Tag, Users, Wallet, TrendingUp, Landmark, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch'
import { formatRupiah } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────

interface ReferralConfig {
  enabled: boolean
  referrerReward: number
  refereeReward: number
  minOrderAmount: number
  minWithdraw: number
}

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

type AdminTab = 'settings' | 'withdrawals'

// ─── Component ─────────────────────────────────────────────────────────

export default function ReferralManager() {
  const [activeTab, setActiveTab] = useState<AdminTab>('settings')
  const [config, setConfig] = useState<ReferralConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Withdrawal management
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [wdLoading, setWdLoading] = useState(false)
  const [wdFilter, setWdFilter] = useState<string>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState<Record<string, string>>({})

  // ─── Fetch settings on mount ────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const data = await adminFetchJson<ReferralConfig & { minWithdraw?: number }>('/api/referral/settings')
        setConfig({
          enabled: data.enabled,
          referrerReward: data.referrerReward,
          refereeReward: data.refereeReward,
          minOrderAmount: data.minOrderAmount,
          minWithdraw: data.minWithdraw || 100000,
        })
      } catch {
        toast.error('Gagal memuat data referral')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // ─── Fetch withdrawals when tab is active ────────────────────────────
  const fetchWithdrawals = useCallback(async () => {
    setWdLoading(true)
    try {
      const params = wdFilter ? `?status=${wdFilter}` : ''
      const data = await adminFetchJson<{ withdrawals?: WithdrawalRow[] } | WithdrawalRow[]>(`/api/referral/withdrawals-admin${params}`)
      setWithdrawals(Array.isArray(data) ? data : Array.isArray(data.withdrawals) ? data.withdrawals : [])
    } catch {
      // Silent
    } finally {
      setWdLoading(false)
    }
  }, [wdFilter])

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawals()
  }, [activeTab, fetchWithdrawals])

  // ─── Save settings ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await adminFetch('/api/referral/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Gagal menyimpan' }))
        throw new Error(data.error || 'Gagal menyimpan')
      }
      toast.success('Pengaturan referral berhasil disimpan!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  // ─── Approve / Reject withdrawal ────────────────────────────────────
  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    const status = action === 'approve' ? 'approved' : 'rejected'
    try {
      const res = await adminFetch('/api/referral/withdrawals-admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          adminNote: noteInput[id] || '',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Gagal memproses' }))
        throw new Error(data.error || 'Gagal memproses')
      }
      toast.success(action === 'approve' ? 'Pencairan disetujui!' : 'Pencairan ditolak')
      setNoteInput((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      fetchWithdrawals()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses')
    } finally {
      setProcessingId(null)
    }
  }

  // ─── Status badge ───────────────────────────────────────────────────
  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px]"><Clock className="size-2.5 mr-0.5" />Menunggu</Badge>
      case 'approved': return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px]">Disetujui</Badge>
      case 'rejected': return <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px]"><XCircle className="size-2.5 mr-0.5" />Ditolak</Badge>
      default: return <Badge className="text-[10px]">{s}</Badge>
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-white/5" />
        <div className="h-4 w-80 rounded-lg bg-white/5" />
        <div className="h-48 w-full rounded-xl bg-white/5" />
      </div>
    )
  }

  if (!config) return null

  const summaryCards = [
    { icon: Gift, label: 'Referrer Reward', value: formatRupiah(config.referrerReward), color: 'from-purple-600/20 to-purple-400/10', iconColor: 'text-purple-400' },
    { icon: Tag, label: 'Referee Discount', value: formatRupiah(config.refereeReward), color: 'from-emerald-600/20 to-emerald-400/10', iconColor: 'text-emerald-400' },
    { icon: Landmark, label: 'Min. Withdraw', value: formatRupiah(config.minWithdraw), color: 'from-sky-600/20 to-sky-400/10', iconColor: 'text-sky-400' },
  ]

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold">
          <span className="gradient-text">Referral</span> Program
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola program referral untuk produk Store & Travel
        </p>
      </div>

      {/* ─── Eligibility Badges ──────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">✅ Produk Store</Badge>
        <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-xs">✅ Travel</Badge>
        <Badge className="bg-red-500/10 text-red-400/70 border-red-500/20 text-xs">❌ Top Up Koin & Diamond</Badge>
        <Badge className="bg-red-500/10 text-red-400/70 border-red-500/20 text-xs">❌ Food & Drink</Badge>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* ─── Tab Switcher ─────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <button onClick={() => setActiveTab('settings')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'settings' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
          <TrendingUp className="size-3.5" /> Pengaturan
        </button>
        <button onClick={() => setActiveTab('withdrawals')} className={`relative flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'withdrawals' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
          <Landmark className="size-3.5" /> Pencairan Dana
          {pendingCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{pendingCount}</span>}
        </button>
      </div>

      {/* ─── Settings Tab ─────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <>
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-400/10 flex items-center justify-center">
                <Gift className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Status Program</p>
                <p className="text-xs text-muted-foreground">{config.enabled ? 'Program referral aktif' : 'Dinonaktifkan'}</p>
              </div>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(checked) => setConfig((prev) => prev ? { ...prev, enabled: checked } : prev)} />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <card.icon className={`size-4 ${card.iconColor}`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{card.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{card.value}</p>
              </div>
            ))}
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Settings Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Referrer Reward (per referral)</Label>
              <Input type="number" value={config.referrerReward} onChange={(e) => setConfig((prev) => prev ? { ...prev, referrerReward: parseFloat(e.target.value) || 0 } : prev)} className="bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl h-10 text-sm" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Referee Discount</Label>
              <Input type="number" value={config.refereeReward} onChange={(e) => setConfig((prev) => prev ? { ...prev, refereeReward: parseFloat(e.target.value) || 0 } : prev)} className="bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl h-10 text-sm" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min. Order Amount</Label>
              <Input type="number" value={config.minOrderAmount} onChange={(e) => setConfig((prev) => prev ? { ...prev, minOrderAmount: parseFloat(e.target.value) || 0 } : prev)} className="bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl h-10 text-sm" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min. Withdraw</Label>
              <Input type="number" value={config.minWithdraw} onChange={(e) => setConfig((prev) => prev ? { ...prev, minWithdraw: parseFloat(e.target.value) || 0 } : prev)} className="bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-xl h-10 text-sm" min={0} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25 rounded-xl px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </>
      )}

      {/* ─── Withdrawals Tab ─────────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <>
          {/* Filter & Refresh */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {['pending', 'approved', 'rejected'].map((s) => (
                <button key={s} onClick={() => setWdFilter(s)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${wdFilter === s ? 'bg-purple-600 text-white' : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] border border-white/[0.04]'}`}>
                  {s === 'pending' ? 'Menunggu' : s === 'approved' ? 'Disetujui' : 'Ditolak'}
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={fetchWithdrawals} disabled={wdLoading} className="gap-1.5 text-muted-foreground h-8">
              <RefreshCw className={`size-3.5 ${wdLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {/* Withdrawal List */}
          {wdLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 text-purple-400 animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Landmark className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Tidak ada permintaan pencairan</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {withdrawals.map((wd) => (
                <div key={wd.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                  {/* Top: Amount + Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">{formatRupiah(wd.amount)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(wd.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {statusBadge(wd.status)}
                  </div>

                  {/* Bank Info */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground/60">Bank</p>
                      <p className="font-medium text-foreground">{wd.bankName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground/60">No. Rekening</p>
                      <p className="font-mono font-medium text-foreground">{wd.bankAccount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground/60">Atas Nama</p>
                      <p className="font-medium text-foreground truncate">{wd.accountHolder}</p>
                    </div>
                  </div>

                  {/* Referrer Info */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02]">
                    <Tag className="size-3 text-purple-400" />
                    <span className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{wd.referralCode?.ownerName}</span>
                      {wd.referralCode?.code && <span className="ml-1 text-muted-foreground/50">({wd.referralCode.code})</span>}
                    </span>
                  </div>

                  {/* Admin Note (for rejected) */}
                  {wd.adminNote && wd.status === 'rejected' && (
                    <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="text-[10px] text-red-400/80">Catatan: {wd.adminNote}</p>
                    </div>
                  )}

                  {/* Actions for pending */}
                  {wd.status === 'pending' && processingId !== wd.id && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Catatan opsional (cth: Sudah ditransfer ke BCA)"
                        value={noteInput[wd.id] || ''}
                        onChange={(e) => setNoteInput((prev) => ({ ...prev, [wd.id]: e.target.value }))}
                        className="h-9 bg-white/[0.03] border-white/[0.06] focus:border-purple-500/30 rounded-lg text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAction(wd.id, 'approve')} className="flex-1 h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs">
                          <CheckCircle2 className="size-3.5" /> Setujui & Bayar
                        </Button>
                        <Button size="sm" onClick={() => handleAction(wd.id, 'reject')} variant="outline" className="flex-1 h-9 gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-xs">
                          <XCircle className="size-3.5" /> Tolak
                        </Button>
                      </div>
                    </div>
                  )}

                  {processingId === wd.id && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="size-4 text-purple-400 animate-spin" />
                      <span className="text-xs text-muted-foreground ml-2">Memproses...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

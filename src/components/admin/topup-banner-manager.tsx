'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Loader2, Eye, EyeOff,
  X, ImagePlus, ImageIcon, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch'

interface BannerItem {
  id: string
  title: string
  subtitle: string
  badge: string
  image: string
  link: string
  color: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

const BADGE_PRESETS = [
  '🔥 FLASH SALE', '✨ PROMO', '💰 CASHBACK', '🎉 EVENT', '⭐ HOT',
  '🆕 BARU', '🏆 VIP', '🎯 SPESIAL', '📌 INFO', '🎁 BONUS',
]

const GRADIENT_PRESETS = [
  'from-purple-600 to-blue-500',
  'from-amber-600 to-orange-500',
  'from-emerald-600 to-teal-500',
  'from-red-600 to-rose-500',
  'from-cyan-600 to-sky-500',
  'from-pink-600 to-fuchsia-500',
  'from-violet-600 to-indigo-500',
  'from-teal-600 to-emerald-500',
  'from-orange-600 to-amber-500',
  'from-blue-600 to-cyan-500',
  'from-rose-600 to-pink-500',
  'from-indigo-600 to-violet-500',
]

// ─── Add / Edit Form ────────────────────────────────────────────────

function BannerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: BannerItem
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const isEditing = !!initial

  const [title, setTitle] = useState(initial?.title || '')
  const [subtitle, setSubtitle] = useState(initial?.subtitle || '')
  const [badge, setBadge] = useState(initial?.badge || '🔥 FLASH SALE')
  const [image, setImage] = useState(initial?.image || '')
  const [link, setLink] = useState(initial?.link || '')
  const [color, setColor] = useState(initial?.color || 'from-purple-600 to-blue-500')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showBadges, setShowBadges] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageFile = useCallback(async (file?: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'topup-banners')
      const res = await adminFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setImage(data.url)
        toast.success('Gambar berhasil diupload')
      } else {
        toast.error(data.error || 'Gagal mengupload gambar')
      }
    } catch {
      toast.error('Gagal mengupload gambar')
    } finally {
      setUploading(false)
    }
  }, [])

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageFile(file)
  }, [handleImageFile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Judul banner tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim(),
        image: image.trim(),
        link: link.trim(),
        color,
        order: Number(order) || 0,
        active: initial?.active ?? true,
      }
      await onSave(payload)
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-card rounded-2xl p-5 md:p-6 mb-4"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {isEditing ? '✏️ Edit' : '➕ Tambah'} Banner
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title + Subtitle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Judul Banner *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 bg-white/5 border-white/[0.06] text-sm" placeholder="Flash Sale Diamond" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subtitle</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="h-9 bg-white/5 border-white/[0.06] text-sm" placeholder="Diskon hingga 30%!" />
          </div>
        </div>

        {/* Badge + Color + Order */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Badge Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Badge</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowBadges(!showBadges); setShowColors(false) }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 border border-white/[0.06] hover:bg-white/[0.08] transition-colors min-w-[140px]"
              >
                <span className="text-[10px] font-medium truncate">{badge}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">Pilih</span>
              </button>
              {showBadges && (
                <div className="absolute top-full left-0 mt-1 z-20 p-2 rounded-xl glass-card border border-white/[0.06] grid grid-cols-2 gap-1 w-64 max-h-52 overflow-y-auto">
                  {BADGE_PRESETS.map((b) => (
                    <button key={b} type="button" onClick={() => { setBadge(b); setShowBadges(false) }} className={`text-[10px] font-medium px-2 py-1.5 rounded-lg text-left transition-colors ${badge === b ? 'bg-purple-500/20 text-purple-300' : 'hover:bg-white/5 text-muted-foreground'}`}>
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Warna</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowColors(!showColors); setShowBadges(false) }}
                className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/5 border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
              >
                <div className={`w-4 h-4 rounded bg-gradient-to-r ${color}`} />
                <span className="text-xs text-muted-foreground">Pilih</span>
              </button>
              {showColors && (
                <div className="absolute top-full left-0 mt-1 z-20 p-2 rounded-xl glass-card border border-white/[0.06] grid grid-cols-4 gap-1.5 w-56">
                  {GRADIENT_PRESETS.map((c) => (
                    <button key={c} type="button" onClick={() => { setColor(c); setShowColors(false) }} className={`h-7 rounded-lg bg-gradient-to-r ${c} border-2 ${color === c ? 'border-white' : 'border-transparent'} transition-all hover:scale-105`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Urutan</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="h-9 w-20 bg-white/5 border-white/[0.06] text-sm" />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Gambar Banner</Label>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Preview" className="w-44 h-24 sm:w-56 sm:h-28 rounded-xl object-cover border border-white/[0.06] shadow-sm" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-44 h-24 sm:w-56 sm:h-28 rounded-xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-1 bg-white/[0.02]">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                  <span className="text-[9px] text-muted-foreground/40">1344 × 768</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageDrop(e) }}
                className="flex-1"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFile(e.target.files?.[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-9 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-xs text-muted-foreground hover:text-foreground gap-2"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {uploading ? 'Mengunggah...' : 'Upload Gambar'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/50">
                Rekomendasi: 1344×768 (landscape). Maks 5MB.
              </p>
              {image && (
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="h-8 bg-white/5 border-white/[0.06] text-[11px] text-muted-foreground placeholder:text-muted-foreground/40"
                  placeholder="atau paste URL gambar..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Link */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tautan / Link <span className="text-muted-foreground/50">(opsional)</span></Label>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="h-9 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground/50"
            placeholder="https://example.com (jika diisi, banner bisa diklik)"
          />
        </div>

        {/* Live Preview */}
        {(title || badge || image || color) && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preview Banner</Label>
            <div className={`relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden select-none ${link ? 'cursor-pointer' : ''}`}>
              {!image ? (
                <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
              ) : (
                <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                {badge && (
                  <div className="mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white/15 backdrop-blur-md text-white border border-white/10">
                      {badge}
                    </span>
                  </div>
                )}
                <h4 className="text-base font-bold text-white">{title || 'Judul Banner'}</h4>
                {subtitle && (
                  <p className="text-[10px] text-white/70 truncate mt-0.5">{subtitle}</p>
                )}
                {link && (
                  <div className="mt-1.5 flex items-center gap-1 text-white/70">
                    <ExternalLink className="size-2.5" />
                    <span className="text-[9px]">Klik untuk membuka</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                <div className="h-1/2 bg-gradient-to-r from-purple-500 to-blue-500 w-1/3" />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" disabled={saving || !title.trim()} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 gap-2 text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Simpan Perubahan' : 'Tambah Banner'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
            Batal
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Main Banner Manager ────────────────────────────────────────────

export default function TopUpBannerManager() {
  const [items, setItems] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<BannerItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const data = await adminFetchJson<BannerItem[]>('/api/topup-banners?all=true')
      setItems(data)
    } catch {
      toast.error('Gagal mengambil data banner')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSave = async (data: Record<string, unknown>) => {
    const isEditing = !!editItem
    const url = isEditing ? `/api/topup-banners/${editItem!.id}` : '/api/topup-banners'
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success(isEditing ? 'Banner berhasil diperbarui' : 'Banner berhasil ditambahkan')
        setShowForm(false)
        setEditItem(null)
        fetchItems()
      } else {
        try {
          const d = await res.json()
          toast.error(d.error || 'Gagal menyimpan')
        } catch {
          toast.error('Gagal menyimpan')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await adminFetch(`/api/topup-banners/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`"${deleteTarget.title}" berhasil dihapus`)
        fetchItems()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Gagal menghapus')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (item: BannerItem) => {
    setToggling(item.id)
    try {
      const res = await adminFetch(`/api/topup-banners/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
        toast.success(item.active ? 'Dinonaktifkan' : 'Diaktifkan')
      } else {
        toast.error('Gagal mengubah status')
      }
    } catch {
      toast.error('Gagal mengubah status')
    } finally {
      setToggling(null)
    }
  }

  const handleEdit = (item: BannerItem) => {
    setEditItem(item)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditItem(null)
  }

  const activeCount = items.filter((i) => i.active).length

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">🖼️ Banner Event & Promosi</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} banner terdaftar • {activeCount} aktif — ditampilkan sebagai auto-slider di halaman Top Up
            </p>
          </div>

          {/* Add Button */}
          {!showForm && (
            <Button
              onClick={() => { setEditItem(null); setShowForm(true) }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 gap-2 mb-4 text-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Banner
            </Button>
          )}

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <BannerForm
                initial={editItem || undefined}
                onSave={handleSave}
                onCancel={handleCancelForm}
              />
            )}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-white/[0.05] p-4 mb-4 text-3xl">🖼️</div>
              <p className="text-sm font-medium text-muted-foreground">Belum ada banner</p>
              <p className="text-xs text-muted-foreground mt-1">Tambahkan banner event & promosi untuk slider di halaman Top Up</p>
            </div>
          )}

          {/* Items List */}
          {!loading && items.length > 0 && (
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`rounded-xl border transition-all duration-200 ${
                      item.active
                        ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                        : 'border-white/[0.03] bg-white/[0.01] opacity-60'
                    }`}
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-3 p-3">
                      {/* Order + Mini Preview */}
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground/50 w-5 text-center">#{item.order}</span>
                        <div className={`w-16 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center overflow-hidden relative shrink-0 shadow-lg shadow-black/10`}>
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-white/30" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-purple-500/10 text-purple-400 border-purple-500/20">
                            {item.badge}
                          </Badge>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                            item.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {item.active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          {item.link && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20 gap-0.5">
                              <ExternalLink className="h-2.5 w-2.5" />
                              Link
                            </Badge>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleToggleActive(item)}
                          disabled={toggling === item.id}
                          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                            item.active
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                          }`}
                          title={item.active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {toggling === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : item.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card border-white/[0.06] bg-popover max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Hapus Banner</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Yakin ingin menghapus banner <span className="font-semibold text-foreground">&quot;{deleteTarget?.title}&quot;</span>? Banner ini akan dihapus dari slider publik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="text-muted-foreground hover:text-foreground border-white/[0.06]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={deleting}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

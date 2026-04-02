'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Loader2, Eye, EyeOff,
  ChevronDown, ChevronUp, X, ExternalLink, ImagePlus, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

type ServiceType = 'topup' | 'food' | 'travel'

interface ServiceItem {
  id: string
  name: string
  subtitle: string
  emoji: string
  color: string
  items: string  // JSON
  desc: string
  link: string
  image: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface ServiceManagerProps {
  type: ServiceType
  title: string
  description: string
  iconEmoji: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024
const UPLOAD_FOLDERS: Record<ServiceType, string> = { topup: 'topup', food: 'food', travel: 'travel' }

const GRADIENT_PRESETS = [
  'from-blue-600 to-blue-400',
  'from-orange-600 to-amber-400',
  'from-amber-600 to-yellow-400',
  'from-violet-600 to-purple-400',
  'from-red-600 to-rose-400',
  'from-emerald-600 to-teal-400',
  'from-cyan-600 to-sky-400',
  'from-pink-600 to-pink-400',
  'from-amber-700 to-amber-500',
  'from-orange-700 to-orange-500',
  'from-red-700 to-red-500',
  'from-pink-700 to-pink-500',
  'from-sky-600 to-blue-400',
  'from-rose-600 to-pink-400',
  'from-teal-600 to-emerald-400',
  'from-indigo-600 to-violet-400',
]

const EMOJI_PRESETS = ['🎮','🔥','🎯','✨','🔫','💳','☕','🍛','🍕','🍰','✈️','🏨','🌴','🚆','🚢','🚗','📱','💻','🎧','📦','🎁','🏆','⭐','💎']

function getApiPath(type: ServiceType) {
  return `/api/${type === 'topup' ? 'topup' : type === 'food' ? 'food' : 'travel'}`
}

function parseItems(itemsJson: string): string[] | { name: string; price: string }[] {
  try {
    const parsed = JSON.parse(itemsJson)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

// ─── Add / Edit Form ────────────────────────────────────────────────

function ServiceForm({
  type,
  initial,
  onSave,
  onCancel,
}: {
  type: ServiceType
  initial?: ServiceItem
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const isEditing = !!initial
  const isFood = type === 'food'
  const isTravel = type === 'travel'

  const [name, setName] = useState(initial?.name || '')
  const [subtitle, setSubtitle] = useState(initial?.subtitle || '')
  const [emoji, setEmoji] = useState(initial?.emoji || (isTravel ? '✈️' : isFood ? '🍜' : '🎮'))
  const [color, setColor] = useState(initial?.color || 'from-purple-600 to-purple-400')
  const [desc, setDesc] = useState(initial?.desc || '')
  const [link, setLink] = useState(initial?.link || '')
  const [image, setImage] = useState(initial?.image || '')
  const [uploading, setUploading] = useState(false)
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderName = type === 'topup' ? 'topup' : type === 'food' ? 'food' : 'travel'

  // Image upload handler
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
      formData.append('folder', folderName)
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
  }, [folderName])

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageFile(file)
  }, [handleImageFile])

  // Items state
  const existingItems = initial ? parseItems(initial.items) : []
  const [textItems, setTextItems] = useState<string[]>(
    isFood ? [] : (existingItems as string[]).length > 0 ? (existingItems as string[]) : ['']
  )
  const [foodItems, setFoodItems] = useState<{ name: string; price: string }[]>(
    isFood && (existingItems as { name: string; price: string }[]).length > 0
      ? (existingItems as { name: string; price: string }[])
      : [{ name: '', price: '' }]
  )

  const [showEmojis, setShowEmojis] = useState(false)
  const [showColors, setShowColors] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        subtitle: subtitle.trim(),
        emoji,
        color,
        order: Number(order) || 0,
        image: image.trim(),
        link: link.trim(),
        active: initial?.active ?? true,
      }
      if (isTravel) {
        payload.desc = desc.trim()
        payload.items = '[]'
      } else if (isFood) {
        const validFood = foodItems.filter((i) => i.name.trim())
        payload.items = JSON.stringify(validFood.map((i) => ({ name: i.name.trim(), price: i.price.trim() })))
        payload.desc = ''
      } else {
        const validText = textItems.filter((i) => i.trim())
        payload.items = JSON.stringify(validText)
        payload.desc = ''
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
        {isEditing ? '✏️ Edit' : '➕ Tambah'} Layanan
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name + Subtitle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nama *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 bg-white/5 border-white/[0.06] text-sm" placeholder="Contoh: Mobile Legends" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subtitle</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="h-9 bg-white/5 border-white/[0.06] text-sm" placeholder="Diamonds & Weekly Pass" />
          </div>
        </div>

        {/* Row 2: Emoji + Color + Order */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Emoji Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Emoji</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowEmojis(!showEmojis); setShowColors(false) }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
              >
                <span className="text-base">{emoji}</span>
                <span className="text-xs text-muted-foreground">Pilih</span>
              </button>
              {showEmojis && (
                <div className="absolute top-full left-0 mt-1 z-20 p-2 rounded-xl glass-card border border-white/[0.06] grid grid-cols-8 gap-1 w-64">
                  {EMOJI_PRESETS.map((e) => (
                    <button key={e} type="button" onClick={() => { setEmoji(e); setShowEmojis(false) }} className="text-lg hover:bg-white/10 rounded p-1 transition-colors">{e}</button>
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
                onClick={() => { setShowColors(!showColors); setShowEmojis(false) }}
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
          <Label className="text-xs text-muted-foreground">Gambar / Foto</Label>
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="shrink-0">
              {image ? (
                <div className="relative group">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-white/[0.06] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-1 bg-white/[0.02]">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                  <span className="text-[9px] text-muted-foreground/40">No image</span>
                </div>
              )}
            </div>

            {/* Upload controls */}
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
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" />
                  )}
                  {uploading ? 'Mengunggah...' : 'Upload Gambar'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/50">
                Drag & drop atau klik untuk upload. Maks 5MB. Jika tidak diupload, emoji akan ditampilkan.
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

        {/* Description (Travel only) */}
        {isTravel && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Deskripsi</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-9 bg-white/5 border-white/[0.06] text-sm" placeholder="Deskripsi layanan travel..." />
          </div>
        )}

        {/* Link Tautan */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tautan / Link</Label>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="h-9 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground/50"
            placeholder="https://example.com (opsional — publik akan membuka di dalam aplikasi)"
          />
          <p className="text-[10px] text-muted-foreground/60">
            Jika diisi, publik yang mengklik layanan ini akan membuka website di dalam aplikasi.
          </p>
        </div>

        {/* Items (TopUp: text list, Food: name+price list) */}
        {!isTravel && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {isFood ? 'Menu Items (Nama & Harga)' : 'Daftar Items'}
            </Label>

            {isFood ? (
              <div className="space-y-1.5">
                {foodItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input value={item.name} onChange={(e) => { const n = [...foodItems]; n[i] = { ...n[i], name: e.target.value }; setFoodItems(n) }} className="h-8 flex-1 bg-white/5 border-white/[0.06] text-xs" placeholder="Nama menu" />
                    <Input value={item.price} onChange={(e) => { const n = [...foodItems]; n[i] = { ...n[i], price: e.target.value }; setFoodItems(n) }} className="h-8 w-28 bg-white/5 border-white/[0.06] text-xs" placeholder="Harga" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setFoodItems(foodItems.filter((_, j) => j !== i))} className="h-8 w-8 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => setFoodItems([...foodItems, { name: '', price: '' }])} className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 gap-1">
                  <Plus className="h-3 w-3" /> Tambah Menu
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {textItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input value={item} onChange={(e) => { const n = [...textItems]; n[i] = e.target.value; setTextItems(n) }} className="h-8 flex-1 bg-white/5 border-white/[0.06] text-xs" placeholder={`Item ${i + 1}`} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setTextItems(textItems.filter((_, j) => j !== i))} className="h-8 w-8 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => setTextItems([...textItems, ''])} className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 gap-1">
                  <Plus className="h-3 w-3" /> Tambah Item
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" disabled={saving || !name.trim()} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 gap-2 text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Simpan Perubahan' : 'Tambah Layanan'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
            Batal
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Main Service Manager ────────────────────────────────────────────

export default function ServiceManager({ type, title, description, iconEmoji }: ServiceManagerProps) {
  const apiPath = getApiPath(type)
  const isTravel = type === 'travel'
  const isFood = type === 'food'

  const [items, setItems] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<ServiceItem | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const data = await adminFetchJson<ServiceItem[]>(`${apiPath}?all=true`)
      setItems(data)
    } catch {
      toast.error('Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }, [apiPath])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSave = async (data: Record<string, unknown>) => {
    const isEditing = !!editItem
    const url = isEditing ? `${apiPath}/${editItem!.id}` : apiPath
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success(isEditing ? 'Layanan berhasil diperbarui' : 'Layanan berhasil ditambahkan')
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
      const res = await adminFetch(`${apiPath}/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`"${deleteTarget.name}" berhasil dihapus`)
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

  const handleToggleActive = async (item: ServiceItem) => {
    setToggling(item.id)
    try {
      const res = await adminFetch(`${apiPath}/${item.id}`, {
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

  const handleEdit = (item: ServiceItem) => {
    setEditItem(item)
    setShowForm(true)
    setExpandedId(null)
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
            <h2 className="text-xl font-bold text-foreground">{iconEmoji} {title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} layanan terdaftar • {activeCount} aktif
            </p>
          </div>

          {/* Add Button */}
          {!showForm && (
            <Button
              onClick={() => { setEditItem(null); setShowForm(true) }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 gap-2 mb-4 text-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Layanan
            </Button>
          )}

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <ServiceForm
                type={type}
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
              <div className="rounded-full bg-white/[0.05] p-4 mb-4 text-3xl">{iconEmoji}</div>
              <p className="text-sm font-medium text-muted-foreground">Belum ada layanan</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          )}

          {/* Items List */}
          {!loading && items.length > 0 && (
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item, index) => {
                  const isExpanded = expandedId === item.id
                  const parsedItems = parseItems(item.items)

                  return (
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
                        {/* Order + Emoji */}
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground/50 w-5 text-center">#{item.order}</span>
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-lg shadow-lg shadow-black/10 overflow-hidden shrink-0`}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{item.emoji}</span>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-foreground truncate">{item.name}</h3>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                              item.active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {item.active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            {!isTravel && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-purple-500/10 text-purple-400 border-purple-500/20">
                                {Array.isArray(parsedItems) ? parsedItems.length : 0} items
                              </Badge>
                            )}
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

                        {/* Expand toggle (has items or desc) */}
                        {((!isTravel && parsedItems.length > 0) || (isTravel && item.desc)) && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}

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

                      {/* Expanded: show items/desc */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 border-t border-white/[0.04] pt-2">
                              {isTravel ? (
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc || 'Tidak ada deskripsi'}</p>
                              ) : isFood ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {(parsedItems as { name: string; price: string }[]).map((fi, i) => (
                                    <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03]">
                                      <span className="text-xs text-foreground">{fi.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{fi.price}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {(parsedItems as string[]).map((ti, i) => (
                                    <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-muted-foreground">
                                      {ti}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card border-white/[0.06] bg-popover max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Hapus Layanan</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Yakin ingin menghapus <span className="font-semibold text-foreground">&quot;{deleteTarget?.name}&quot;</span>? Tindakan ini tidak dapat dibatalkan.
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

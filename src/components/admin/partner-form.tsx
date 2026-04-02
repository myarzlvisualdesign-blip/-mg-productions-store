'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { adminFetch } from '@/lib/admin-fetch'

export interface Partner {
  id: string
  name: string
  description: string
  image: string
  link: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface PartnerFormProps {
  editPartner: Partner | null
  onDone: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export default function PartnerForm({ editPartner, onDone }: PartnerFormProps) {
  const isEditing = !!editPartner
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    image: '',
    link: '',
    order: '',
    active: true,
  })

  const [errors, setErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (editPartner) {
      setForm({
        name: editPartner.name,
        description: editPartner.description,
        image: editPartner.image,
        link: editPartner.link || '',
        order: editPartner.order.toString(),
        active: editPartner.active,
      })
      setImagePreview(editPartner.image)
    }
  }, [editPartner])

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const uploadImage = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'partners')

      const res = await adminFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.url) {
        updateField('image', data.url)
        setImagePreview(data.url)
        toast.success('Gambar berhasil diupload')
      } else {
        toast.error(data.error || 'Gagal mengupload gambar')
      }
    } catch {
      toast.error('Gagal mengupload gambar. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) {
        uploadImage(file)
      }
    },
    [uploadImage]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = () => {
    updateField('image', '')
    setImagePreview('')
  }

  const validate = () => {
    const newErrors: Record<string, boolean> = {}
    if (!form.name.trim()) newErrors.name = true
    if (!form.image.trim()) newErrors.image = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Harap isi semua field yang wajib')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image,
        link: form.link.trim(),
        order: parseInt(form.order) || 0,
        active: form.active,
      }

      const url = isEditing ? `/api/partners/${editPartner!.id}` : '/api/partners'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(isEditing ? 'Mitra berhasil diperbarui' : 'Mitra berhasil ditambahkan')
        onDone()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan mitra')
      }
    } catch {
      toast.error('Gagal menyimpan mitra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass-card rounded-2xl p-6 md:p-8 purple-glow">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Mitra' : 'Tambah Mitra Baru'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing
              ? 'Perbarui detail mitra di bawah'
              : 'Isi detail untuk menambahkan mitra baru'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Partner Name */}
          <div className="space-y-2">
            <Label htmlFor="partner-name" className="text-sm font-medium text-foreground">
              Nama Mitra <span className="text-red-400">*</span>
            </Label>
            <Input
              id="partner-name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Masukkan nama mitra"
              className={`h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50 ${
                errors.name ? 'border-red-500/50 focus:border-red-500/50' : ''
              }`}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="partner-desc" className="text-sm font-medium text-foreground">
              Deskripsi
            </Label>
            <Textarea
              id="partner-desc"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Deskripsi singkat tentang mitra (opsional)"
              rows={2}
              className="bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50 resize-none"
            />
          </div>

          {/* Link / Tautan Produk */}
          <div className="space-y-2">
            <Label htmlFor="partner-link" className="text-sm font-medium text-foreground">
              Tautan Produk / Website
            </Label>
            <Input
              id="partner-link"
              type="url"
              value={form.link}
              onChange={(e) => updateField('link', e.target.value)}
              placeholder="https://example.com (opsional)"
              className="h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
            />
            <p className="text-xs text-muted-foreground">
              Jika diisi, avatar mitra di storefront akan bisa diklik menuju link ini
            </p>
          </div>

          {/* Image Upload — circular preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Foto Mitra <span className="text-red-400">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                (Akan ditampilkan sebagai avatar bulat)
              </span>
            </Label>
            <AnimatePresence mode="wait">
              {!imagePreview ? (
                <motion.div
                  key="upload-area"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`
                      relative cursor-pointer rounded-xl border-2 border-dashed p-6
                      transition-all duration-200 text-center
                      ${
                        dragOver
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.04]'
                      }
                      ${uploading ? 'pointer-events-none opacity-60' : ''}
                      ${errors.image ? 'border-red-500/50' : ''}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                        <p className="text-sm text-muted-foreground">Mengupload gambar...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-white/[0.05] p-3">
                          <Upload className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Klik atau seret gambar ke sini
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WebP, atau GIF (maks. 5MB) • Gambar persegi disarankan
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview-area"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/40 bg-black/20">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Foto diupload</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    >
                      <ImageIcon className="h-3 w-3" />
                      Ganti gambar
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order & Active */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner-order" className="text-sm font-medium text-foreground">
                Urutan Tampil
              </Label>
              <Input
                id="partner-order"
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => updateField('order', e.target.value)}
                placeholder="0"
                className="h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
              />
              <p className="text-xs text-muted-foreground">
                Angka kecil = ditampilkan lebih dulu
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4 border border-white/[0.06]">
              <div>
                <Label htmlFor="partner-active" className="text-sm font-medium text-foreground">
                  Status Aktif
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tampilkan di storefront
                </p>
              </div>
              <Switch
                id="partner-active"
                checked={form.active}
                onCheckedChange={(checked) => updateField('active', checked)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving || uploading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all duration-200"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Menyimpan...
                </span>
              ) : isEditing ? (
                'Simpan Perubahan'
              ) : (
                'Simpan Mitra'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onDone}
              className="text-muted-foreground hover:text-foreground"
            >
              Batal
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

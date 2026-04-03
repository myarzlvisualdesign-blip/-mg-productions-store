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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Product } from './inventory-table'
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch'
import { formatRupiah } from '@/lib/utils'
import { broadcastLiveSync } from '@/lib/live-sync'

interface ProductFormProps {
  editProduct: Product | null
  onDone: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export default function ProductForm({ editProduct, onDone }: ProductFormProps) {
  const isEditing = !!editProduct
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [catsLoading, setCatsLoading] = useState(true)

  // Fetch categories from DB
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await adminFetchJson<{ name: string }[]>('/api/categories')
        setCategories(data.map((c) => c.name))
      } catch {
        console.error('Failed to fetch categories')
      } finally {
        setCatsLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const [imagePreview, setImagePreview] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    link: '',
    stock: '',
    rating: '',
    featured: false,
  })

  const [errors, setErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name,
        description: editProduct.description,
        price: editProduct.price.toString(),
        category: editProduct.category,
        image: editProduct.image,
        link: (editProduct as unknown as Record<string, unknown>).link ? String((editProduct as unknown as Record<string, unknown>).link) : '',
        stock: editProduct.stock.toString(),
        rating: editProduct.rating.toString(),
        featured: editProduct.featured,
      })
      setImagePreview(editProduct.image)
    }
  }, [editProduct])

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
    // Reset input so the same file can be selected again
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
    if (!form.description.trim()) newErrors.description = true
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = true
    if (!form.category) newErrors.category = true
    if (!form.image.trim()) newErrors.image = true
    if (!form.stock || parseInt(form.stock) < 0) newErrors.stock = true
    if (form.rating && (parseFloat(form.rating) < 0 || parseFloat(form.rating) > 5))
      newErrors.rating = true
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
        price: parseFloat(form.price),
        category: form.category,
        image: form.image,
        link: form.link.trim(),
        stock: parseInt(form.stock) || 0,
        rating: parseFloat(form.rating) || 0,
        featured: form.featured,
      }

      const url = isEditing ? `/api/products/${editProduct!.id}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        broadcastLiveSync('products')
        toast.success(isEditing ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan')
        onDone()
      } else {
        toast.error('Gagal menyimpan produk')
      }
    } catch {
      toast.error('Gagal menyimpan produk')
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
            {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing
              ? 'Perbarui detail produk di bawah'
              : 'Isi detail untuk membuat produk baru'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Nama Produk <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Masukkan nama produk"
              className={`h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50 ${
                errors.name ? 'border-red-500/50 focus:border-red-500/50' : ''
              }`}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Deskripsi <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Masukkan deskripsi produk"
              rows={3}
              className={`bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50 resize-none ${
                errors.description ? 'border-red-500/50 focus:border-red-500/50' : ''
              }`}
            />
          </div>

          {/* Link Tautan Produk */}
          <div className="space-y-2">
            <Label htmlFor="link" className="text-sm font-medium text-foreground">
              Tautan Produk / Website
            </Label>
            <Input
              id="link"
              type="url"
              value={form.link}
              onChange={(e) => updateField('link', e.target.value)}
              placeholder="https://example.com/produk (opsional)"
              className="h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50"
            />
            <p className="text-xs text-muted-foreground">
              Jika diisi, pelanggan yang klik produk akan diarahkan ke link ini
            </p>
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium text-foreground">
                Harga (Rp) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0.00"
                className={`h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50 ${
                  errors.price ? 'border-red-500/50 focus:border-red-500/50' : ''
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-foreground">
                Kategori <span className="text-red-400">*</span>
              </Label>
              {catsLoading ? (
                <div className="h-10 animate-pulse rounded-md bg-white/5" />
              ) : (
                <Select value={form.category} onValueChange={(val) => updateField('category', val)}>
                  <SelectTrigger
                    className={`h-10 bg-white/5 border-white/[0.06] text-sm text-foreground focus:border-purple-500/50 ${
                      errors.category ? 'border-red-500/50 focus:border-red-500/50' : ''
                    }`}
                  >
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/[0.06]">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm focus:bg-white/5">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Gambar Produk <span className="text-red-400">*</span>
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
                            JPG, PNG, WebP, atau GIF (maks. 5MB)
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
                  className="relative"
                >
                  <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/20">
                    <div className="aspect-video w-full">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white/80 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stock & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock" className="text-sm font-medium text-foreground">
                Stok <span className="text-red-400">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                placeholder="0"
                className={`h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50 ${
                  errors.stock ? 'border-red-500/50 focus:border-red-500/50' : ''
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating" className="text-sm font-medium text-foreground">
                Rating (0-5)
              </Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => updateField('rating', e.target.value)}
                placeholder="0"
                className={`h-10 bg-white/5 border-white/[0.06] text-sm placeholder:text-muted-foreground focus:border-purple-500/50 ${
                  errors.rating ? 'border-red-500/50 focus:border-red-500/50' : ''
                }`}
              />
            </div>
          </div>

          {/* Featured Switch */}
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4 border border-white/[0.06]">
            <div>
              <Label htmlFor="featured" className="text-sm font-medium text-foreground">
                Produk Unggulan
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tampilkan produk ini di bagian unggulan
              </p>
            </div>
            <Switch
              id="featured"
              checked={form.featured}
              onCheckedChange={(checked) => updateField('featured', checked)}
            />
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
                'Simpan Produk'
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

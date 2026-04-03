import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { requireAdmin } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function getSafeFolder(folder: string) {
  return folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'products'
}

function toDataUrl(fileType: string, buffer: Buffer) {
  return `data:${fileType};base64,${buffer.toString('base64')}`
}

export async function POST(request: NextRequest) {
  const { authorized } = requireAdmin(request)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Akses ditolak. Login sebagai admin diperlukan.' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const folder = (formData.get('folder') as string) || 'products'

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang dipilih' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const safeFolder = getSafeFolder(folder)

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`${safeFolder}/${uniqueName}`, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        contentType: file.type,
      })

      return NextResponse.json({ url: blob.url })
    }

    if (process.env.VERCEL) {
      return NextResponse.json({
        url: toDataUrl(file.type, buffer),
        storage: 'inline',
      })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', safeFolder)
    const filePath = join(uploadDir, uniqueName)
    await mkdir(uploadDir, { recursive: true })
    await writeFile(filePath, buffer)

    return NextResponse.json({ url: `/uploads/${safeFolder}/${uniqueName}` })
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengupload gambar' },
      { status: 500 }
    )
  }
}

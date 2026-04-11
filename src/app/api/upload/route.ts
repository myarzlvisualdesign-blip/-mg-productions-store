import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
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

type UploadRuntimeEnv = {
  BLOB_READ_WRITE_TOKEN?: string
  VERCEL?: string
  GITHUB_UPLOAD_TOKEN?: string
  GITHUB_UPLOAD_OWNER?: string
  GITHUB_UPLOAD_REPO?: string
  GITHUB_UPLOAD_BRANCH?: string
}

function getRuntimeEnv(): UploadRuntimeEnv {
  try {
    const { env } = getCloudflareContext()
    return env as UploadRuntimeEnv
  } catch {
    return process.env as UploadRuntimeEnv
  }
}

function isCloudflareWorkerRuntime() {
  try {
    getCloudflareContext()
    return true
  } catch {
    return false
  }
}

async function uploadToGitHub(params: {
  buffer: Buffer
  contentType: string
  owner: string
  repo: string
  branch: string
  token: string
  path: string
}) {
  const { buffer, contentType, owner, repo, branch, token, path } = params
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'mg-productions-store-upload',
    },
    body: JSON.stringify({
      message: `upload ${path}`,
      content: buffer.toString('base64'),
      branch,
    }),
  })

  if (!response.ok) {
    const payload = await response.text().catch(() => '')
    throw new Error(payload || `GitHub upload failed with status ${response.status}`)
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
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
    const runtimeEnv = getRuntimeEnv()
    const githubOwner = runtimeEnv.GITHUB_UPLOAD_OWNER
    const githubRepo = runtimeEnv.GITHUB_UPLOAD_REPO
    const githubBranch = runtimeEnv.GITHUB_UPLOAD_BRANCH || 'cdn-assets'
    const githubToken = runtimeEnv.GITHUB_UPLOAD_TOKEN
    const uploadPath = `uploads/${safeFolder}/${uniqueName}`

    if (githubToken && githubOwner && githubRepo) {
      const url = await uploadToGitHub({
        buffer,
        contentType: file.type,
        owner: githubOwner,
        repo: githubRepo,
        branch: githubBranch,
        token: githubToken,
        path: uploadPath,
      })

      return NextResponse.json({ url, storage: 'github' })
    }

    if (runtimeEnv.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`${safeFolder}/${uniqueName}`, file, {
        access: 'public',
        token: runtimeEnv.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        contentType: file.type,
      })

      return NextResponse.json({ url: blob.url })
    }

    if (runtimeEnv.VERCEL) {
      return NextResponse.json({
        url: toDataUrl(file.type, buffer),
        storage: 'inline',
      })
    }

    if (isCloudflareWorkerRuntime()) {
      return NextResponse.json(
        { error: 'Storage upload belum dikonfigurasi di server Cloudflare.' },
        { status: 503 }
      )
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

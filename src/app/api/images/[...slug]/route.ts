import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join, resolve } from 'path'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const UPLOADS_ROOT = resolve(process.cwd(), 'public', 'uploads')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    // slug = ['products', 'filename.jpg']
    const relativePath = slug.join('/')

    if (!relativePath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Security: prevent path traversal — resolve and verify within UPLOADS_ROOT
    const safePath = relativePath.replace(/\.\./g, '')
    const filePath = resolve(UPLOADS_ROOT, safePath)

    if (!filePath.startsWith(UPLOADS_ROOT + '/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const ext = '.' + safePath.split('.').pop()?.toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}

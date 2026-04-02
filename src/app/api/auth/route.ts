import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCredentials,
  generateToken,
  extractBearerToken,
  verifyToken,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const isSecure =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https'
    const body = await request.json()
    const { action, username, password } = body

    // LOGIN
    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json(
          { error: 'Username dan password wajib diisi' },
          { status: 400 }
        )
      }

      if (!verifyCredentials(username, password)) {
        return NextResponse.json(
          { error: 'Username atau password salah' },
          { status: 401 }
        )
      }

      const token = generateToken(username)

      const response = NextResponse.json({
        success: true,
        message: 'Login berhasil',
        username,
      })

      // Set HTTP-only cookie
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })

      return response
    }

    // LOGOUT — with self-verifying tokens, we just clear the cookie
    if (action === 'logout') {
      const response = NextResponse.json({
        success: true,
        message: 'Logout berhasil',
      })

      response.cookies.set('admin_token', '', {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })

      return response
    }

    return NextResponse.json(
      { error: 'Action tidak valid' },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const result = verifyToken(token)
    if (!result.valid) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      username: result.username,
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

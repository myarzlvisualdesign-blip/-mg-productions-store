import { NextRequest, NextResponse } from 'next/server'
import {
  verifyCredentials,
  generateToken,
  extractBearerToken,
  verifyToken,
} from '@/lib/auth'

const AUTH_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
} as const

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
          { status: 400, headers: AUTH_HEADERS }
        )
      }

      if (!verifyCredentials(username, password)) {
        return NextResponse.json(
          { error: 'Username atau password salah' },
          { status: 401, headers: AUTH_HEADERS }
        )
      }

      const token = generateToken(username)

      const response = NextResponse.json({
        success: true,
        message: 'Login berhasil',
        username,
      }, {
        headers: AUTH_HEADERS,
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
      }, {
        headers: AUTH_HEADERS,
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
      { status: 400, headers: AUTH_HEADERS }
    )
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500, headers: AUTH_HEADERS }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401, headers: AUTH_HEADERS })
    }

    const result = verifyToken(token)
    if (!result.valid) {
      return NextResponse.json({ authenticated: false }, { status: 401, headers: AUTH_HEADERS })
    }

    return NextResponse.json({
      authenticated: true,
      username: result.username,
    }, {
      headers: AUTH_HEADERS,
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500, headers: AUTH_HEADERS })
  }
}

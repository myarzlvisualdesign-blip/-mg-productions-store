import { createHash, randomBytes, createHmac } from 'crypto'

// Admin credentials — in production, use env vars.
// Keep legacy fallbacks so old admin credentials continue to work after deploys.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mgproductions2025'
const LEGACY_PASSWORDS = ['mgproductions2025', 'AdminMG2026!']

// Secret key for signing tokens (derived at startup, stable across hot reloads)
const SIGNING_SECRET = process.env.AUTH_SECRET || 'mg-productions-auth-secret-key-2025'

// Token expiry: 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

// Create a self-verifying token: base64(payload).hmac_signature
// payload = base64({ username, exp, nonce })
// This way we don't need server-side storage — tokens are self-contained
export function generateToken(username: string): string {
  const nonce = randomBytes(16).toString('hex')
  const exp = Date.now() + TOKEN_EXPIRY_MS

  const payload = Buffer.from(JSON.stringify({ username, exp, nonce })).toString('base64url')
  const signature = createHmac('sha256', SIGNING_SECRET).update(payload).digest('base64url')

  return `${payload}.${signature}`
}

export function verifyToken(token: string): { valid: boolean; username?: string } {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return { valid: false }

    const [payload, signature] = parts

    // Verify signature
    const expectedSig = createHmac('sha256', SIGNING_SECRET).update(payload).digest('base64url')
    if (signature !== expectedSig) return { valid: false }

    // Decode payload
    const json = Buffer.from(payload, 'base64url').toString()
    const data = JSON.parse(json)

    // Check expiry
    if (Date.now() > data.exp) return { valid: false }

    return { valid: true, username: data.username }
  } catch {
    return { valid: false }
  }
}

export function verifyCredentials(username: string, password: string): boolean {
  const hashedInput = createHash('sha256').update(password).digest('hex')
  const allowedHashes = [ADMIN_PASSWORD, ...LEGACY_PASSWORDS]
    .filter(Boolean)
    .map((value) => createHash('sha256').update(value).digest('hex'))

  return username === ADMIN_USERNAME && allowedHashes.includes(hashedInput)
}

export function extractBearerToken(request: Request): string | null {
  // 1. Check Authorization header
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }

  // 2. Check cookie header
  const cookie = request.headers.get('cookie')
  if (cookie) {
    const match = cookie.match(/admin_token=([^;]+)/)
    if (match) return match[1]
  }

  return null
}

// Middleware helper for admin routes
export function requireAdmin(request: Request): { authorized: boolean; username?: string } {
  const token = extractBearerToken(request)
  if (!token) return { authorized: false }

  const result = verifyToken(token)
  return {
    authorized: result.valid,
    username: result.username,
  }
}

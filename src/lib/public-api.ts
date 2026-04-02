import { NextResponse } from 'next/server'

const PUBLIC_API_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
} as const

export function publicJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...PUBLIC_API_HEADERS,
      ...(init?.headers ?? {}),
    },
  })
}

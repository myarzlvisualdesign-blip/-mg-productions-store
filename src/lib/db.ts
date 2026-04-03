import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient() {
  const rawUrl = process.env.DATABASE_URL

  if (!rawUrl) {
    return new PrismaClient()
  }

  try {
    const parsed = new URL(rawUrl)
    const isSupabasePooler = parsed.hostname.endsWith('.pooler.supabase.com')

    // Production was repeatedly configured with the session pooler on :5432.
    // Force Prisma runtime traffic onto the safer transaction pooler setup.
    if (isSupabasePooler && parsed.port === '5432') {
      parsed.port = '6543'
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true')
      }
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '1')
      }
      if (!parsed.searchParams.has('sslmode')) {
        parsed.searchParams.set('sslmode', 'require')
      }
    }

    return new PrismaClient({
      datasources: {
        db: {
          url: parsed.toString(),
        },
      },
    })
  } catch {
    return new PrismaClient()
  }
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

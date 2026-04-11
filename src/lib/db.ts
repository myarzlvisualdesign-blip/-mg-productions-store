import { getCloudflareContext } from '@opennextjs/cloudflare'
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { cache } from 'react'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

type CloudflareEnv = {
  DB?: D1Database
  DATABASE_URL?: string
}

function createCloudflareClient() {
  try {
    const { env } = getCloudflareContext()
    const database = (env as CloudflareEnv).DB

    if (!database) return null

    const adapter = new PrismaD1(database)
    return new PrismaClient({ adapter })
  } catch {
    return null
  }
}

function createLocalClient() {
  const existing = globalForPrisma.prisma

  if (existing) {
    return existing
  }

  const client = process.env.DATABASE_URL
    ? new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      })
    : new PrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

export const getDb = cache(() => createCloudflareClient() ?? createLocalClient())

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb()
    const value = client[prop as keyof PrismaClient]

    return typeof value === 'function' ? value.bind(client) : value
  },
})

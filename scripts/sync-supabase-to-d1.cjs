/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const outputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), '.vercel-temp', 'supabase-to-d1.sql')

const assetOutputDir = process.env.ASSET_OUTPUT_DIR
  ? path.resolve(process.env.ASSET_OUTPUT_DIR)
  : null
const assetBaseUrl = process.env.ASSET_BASE_URL
  ? process.env.ASSET_BASE_URL.replace(/\/+$/, '')
  : null

const DELETE_ORDER = [
  'ReferralWithdrawal',
  'ReferralUse',
  'ReferralCode',
  'ReferralSettings',
  'ChatbotSettings',
  'TopUpBanner',
  'TravelService',
  'FoodItem',
  'TopUpService',
  'Order',
  'Partner',
  'Product',
  'PopularDestination',
  'Category',
]

const INSERT_ORDER = [
  'Category',
  'PopularDestination',
  'Product',
  'Partner',
  'Order',
  'TopUpService',
  'FoodItem',
  'TravelService',
  'TopUpBanner',
  'ChatbotSettings',
  'ReferralSettings',
  'ReferralCode',
  'ReferralUse',
  'ReferralWithdrawal',
]

const BOOLEAN_COLUMNS = new Set(['active', 'featured', 'enabled'])
const DATE_COLUMNS = new Set(['createdAt', 'updatedAt'])
const INSERT_BATCH_SIZE = 1

const ASSET_COLUMN_FOLDERS = {
  Product: { image: 'products' },
  Partner: { image: 'partners' },
  TopUpBanner: { image: 'topup-banners' },
  TopUpService: { image: 'topup' },
  ChatbotSettings: { avatar: 'chatbot' },
}

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function toSqlLiteral(value, column) {
  if (value === null || value === undefined) return 'NULL'

  if (BOOLEAN_COLUMNS.has(column)) {
    return value ? '1' : '0'
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }

  if (value instanceof Date) {
    return `'${value.toISOString().replace(/'/g, "''")}'`
  }

  if (DATE_COLUMNS.has(column) && typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL'
  }

  return `'${String(value).replace(/'/g, "''")}'`
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl)
  if (!match) return null

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

function ensureAssetConfig() {
  if (assetOutputDir && assetBaseUrl) return
  if (!assetOutputDir && !assetBaseUrl) return

  throw new Error('ASSET_OUTPUT_DIR and ASSET_BASE_URL must be provided together')
}

function materializeAssets(table, row) {
  const columns = ASSET_COLUMN_FOLDERS[table]
  if (!columns) return row
  if (!assetOutputDir || !assetBaseUrl) return row

  let nextRow = row

  for (const [column, folder] of Object.entries(columns)) {
    const value = nextRow[column]
    if (typeof value !== 'string' || !value.startsWith('data:')) continue

    const parsed = parseDataUrl(value)
    if (!parsed) continue

    const extension = MIME_EXTENSIONS[parsed.mimeType] || 'bin'
    const filename = `${nextRow.id}.${extension}`
    const localDir = path.join(assetOutputDir, folder)
    const localPath = path.join(localDir, filename)

    fs.mkdirSync(localDir, { recursive: true })
    fs.writeFileSync(localPath, parsed.buffer)

    nextRow = {
      ...nextRow,
      [column]: `${assetBaseUrl}/${folder}/${filename}`,
    }
  }

  return nextRow
}

async function readTable(client, table) {
  const result = await client.query(`SELECT * FROM "${table}"`)
  return {
    columns: result.fields.map((field) => field.name),
    rows: result.rows.map((row) => materializeAssets(table, row)),
  }
}

function buildInsert(table, columns, rows) {
  if (!columns.length) {
    return `-- ${table}: no columns returned`
  }

  if (!rows.length) {
    return `-- ${table}: no rows`
  }

  const columnList = columns.map((column) => `"${column}"`).join(', ')
  const statements = []

  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const chunk = rows.slice(index, index + INSERT_BATCH_SIZE)
    const values = chunk
      .map((row) => {
        const rowValues = columns
          .map((column) => toSqlLiteral(row[column], column))
          .join(', ')

        return `(${rowValues})`
      })
      .join(',\n')

    statements.push(`INSERT INTO "${table}" (${columnList}) VALUES\n${values};`)
  }

  return statements.join('\n')
}

async function main() {
  ensureAssetConfig()

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is required')
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const tableData = new Map()

    for (const table of INSERT_ORDER) {
      tableData.set(table, await readTable(client, table))
    }

    const statements = [
      '-- Generated from Supabase/Postgres for Cloudflare D1 import',
      'PRAGMA defer_foreign_keys = on;',
      ...DELETE_ORDER.map((table) => `DELETE FROM "${table}";`),
      '',
    ]

    for (const table of INSERT_ORDER) {
      const { columns, rows } = tableData.get(table)
      statements.push(buildInsert(table, columns, rows))
      statements.push('')
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${statements.join('\n')}\n`, 'utf8')

    for (const table of INSERT_ORDER) {
      const { rows } = tableData.get(table)
      console.log(`${table}=${rows.length}`)
    }
    console.log(`Wrote ${outputPath}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

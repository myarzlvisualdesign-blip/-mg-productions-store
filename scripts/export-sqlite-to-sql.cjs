/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync, writeFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const sqlitePath = path.join(process.cwd(), 'db', 'custom.db')
const outputPath = path.join(process.cwd(), 'supabase-import.sql')

const TABLES = [
  'Category',
  'ChatbotSettings',
  'FoodItem',
  'Order',
  'Partner',
  'PopularDestination',
  'Product',
  'ReferralCode',
  'ReferralSettings',
  'ReferralUse',
  'ReferralWithdrawal',
  'TopUpBanner',
  'TopUpService',
  'TravelService',
]

const BOOLEAN_COLUMNS = new Set([
  'active',
  'featured',
  'enabled',
])

function readSqlite(table) {
  const query = `select * from "${table}";`
  const output = execFileSync('sqlite3', ['-json', sqlitePath, query], {
    encoding: 'utf8',
  })

  return output.trim() ? JSON.parse(output) : []
}

function sqlValue(value, column) {
  if (value === null || value === undefined) return 'NULL'
  if (BOOLEAN_COLUMNS.has(column)) {
    return Number(value) ? 'true' : 'false'
  }
  if ((column === 'createdAt' || column === 'updatedAt') && typeof value === 'number') {
    return `to_timestamp(${value} / 1000.0)`
  }
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return `'${String(value).replace(/'/g, "''")}'`
}

function buildInsert(table, rows) {
  if (!rows.length) {
    return `-- ${table}: no rows\n`
  }

  const columns = Object.keys(rows[0])
  const columnList = columns.map((col) => `"${col}"`).join(', ')
  const valueRows = rows
    .map((row) => `(${columns.map((col) => sqlValue(row[col], col)).join(', ')})`)
    .join(',\n')

  return [
    `delete from "${table}";`,
    `insert into "${table}" (${columnList}) values`,
    `${valueRows};`,
    '',
  ].join('\n')
}

function main() {
  const statements = [
    '-- Generated from db/custom.db',
    '-- Import this file in Supabase SQL Editor',
    '',
  ]

  for (const table of TABLES) {
    const rows = readSqlite(table)
    statements.push(buildInsert(table, rows))
  }

  fs.writeFileSync(outputPath, statements.join('\n'), 'utf8')
  console.log(`Wrote ${outputPath}`)
}

main()

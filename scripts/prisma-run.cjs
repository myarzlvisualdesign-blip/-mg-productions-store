#!/usr/bin/env node

const { spawnSync } = require('child_process')
const path = require('path')

const schemaPath = process.env.PRISMA_SCHEMA_PATH
  ? path.resolve(process.cwd(), process.env.PRISMA_SCHEMA_PATH)
  : path.resolve(
      process.cwd(),
      process.env.VERCEL ? 'prisma/schema.vercel.prisma' : 'prisma/schema.prisma'
    )

const args = process.argv.slice(2)
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const result = spawnSync(command, ['prisma', ...args, '--schema', schemaPath], {
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 0)

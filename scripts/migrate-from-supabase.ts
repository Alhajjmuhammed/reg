/**
 * One-time migration: copies every row from Supabase app_store → SQLite kv_store.
 * Run ONCE on the VPS after deploying the SQLite branch:
 *
 *   npx tsx scripts/migrate-from-supabase.ts
 *
 * Uses direct HTTP fetch (no Supabase SDK) so it works on Node.js 18/20/22.
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
  console.log('Loaded .env.local')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set in .env.local')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in .env.local')
  process.exit(1)
}

async function main() {
  // Read all rows from Supabase via plain REST API (no SDK, no WebSocket)
  console.log('Fetching data from Supabase...')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_store?select=key,value`, {
    headers: {
      'apikey': SUPABASE_KEY!,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    console.error(`Supabase request failed: ${res.status} ${res.statusText}`)
    process.exit(1)
  }

  const data: { key: string; value: unknown }[] = await res.json()

  if (!data || data.length === 0) {
    console.log('No data found in Supabase app_store. Nothing to migrate.')
    return
  }

  console.log(`Found ${data.length} rows in Supabase. Migrating to SQLite...`)

  const prisma = new PrismaClient()

  try {
    let migrated = 0
    let skipped = 0

    for (const row of data) {
      const existing = await prisma.kvStore.findUnique({ where: { key: row.key } })
      if (existing) {
        console.log(`  SKIP (already exists): ${row.key}`)
        skipped++
        continue
      }

      await prisma.kvStore.create({
        data: {
          key: row.key,
          value: JSON.stringify(row.value),
        },
      })
      console.log(`  OK: ${row.key}`)
      migrated++
    }

    console.log(`\n✓ Migration complete: ${migrated} migrated, ${skipped} skipped.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

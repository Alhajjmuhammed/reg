import { NextRequest, NextResponse } from 'next/server'
import { dbGetAll, dbGetOne, dbSet } from '@/lib/db'

// Force dynamic — never let Next.js statically cache this route.
export const dynamic = 'force-dynamic'

const NO_CACHE = { 'Cache-Control': 'no-store' }

// Keys that grow unboundedly with usage — excluded from light mode.
const HEAVY_KEYS = new Set([
  'masterclass_participants',
  'masterclass_transactions',
  'masterclass_groups',
  'masterclass_notifications',
])

// Recursively replace any base64 data: strings with '' so the light response
// stays small. Works for every key at any nesting depth — new admin image
// uploads use /uploads/ URLs and are not affected.
function stripBase64Recursive(value: unknown): unknown {
  if (typeof value === 'string') return value.startsWith('data:') ? '' : value
  if (Array.isArray(value)) return value.map(stripBase64Recursive)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripBase64Recursive(v)])
    )
  }
  return value
}

function stripBase64Images(rows: { key: string; value: unknown }[]): { key: string; value: unknown }[] {
  return rows.map(r => ({ ...r, value: stripBase64Recursive(r.value) }))
}

// GET /api/store            → all rows as [{ key, value }]
// GET /api/store?light=1    → rows excluding heavy operational data (fast initial load)
// GET /api/store?heavy=1    → only the heavy rows (admin lazy-loads these)
// GET /api/store?key=K      → single row as { key, value } or null
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key')
    if (key) {
      return NextResponse.json(dbGetOne(key), { headers: NO_CACHE })
    }
    const light = req.nextUrl.searchParams.get('light') === '1'
    const heavy = req.nextUrl.searchParams.get('heavy') === '1'
    let rows = dbGetAll()
    if (light) {
      rows = rows.filter(r => !HEAVY_KEYS.has(r.key))
      rows = stripBase64Images(rows)
    } else if (heavy) {
      rows = rows.filter(r => HEAVY_KEYS.has(r.key))
    }
    return NextResponse.json(rows, { headers: NO_CACHE })
  } catch (err) {
    console.error('[api/store GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/store   body: { key: string, value: unknown }
// Upserts a single key-value pair.
export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    dbSet(key, value)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/store POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

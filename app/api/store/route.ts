import { NextRequest, NextResponse } from 'next/server'
import { dbGetAll, dbGetOne, dbSet } from '@/lib/db'

// Keys that grow unboundedly with usage — excluded from light mode to keep
// the initial page-load fetch small (KB not MB).
const HEAVY_KEYS = new Set([
  'masterclass_participants',
  'masterclass_transactions',
  'masterclass_groups',
  'masterclass_notifications',
])

// GET /api/store            → all rows as [{ key, value }]
// GET /api/store?light=1    → rows excluding heavy operational data (fast initial load)
// GET /api/store?heavy=1    → only the heavy rows (admin lazy-loads these)
// GET /api/store?key=K      → single row as { key, value } or null
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key')
    if (key) {
      return NextResponse.json(dbGetOne(key))
    }
    const light = req.nextUrl.searchParams.get('light') === '1'
    const heavy = req.nextUrl.searchParams.get('heavy') === '1'
    let rows = dbGetAll()
    if (light) rows = rows.filter(r => !HEAVY_KEYS.has(r.key))
    else if (heavy) rows = rows.filter(r => HEAVY_KEYS.has(r.key))
    return NextResponse.json(rows)
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

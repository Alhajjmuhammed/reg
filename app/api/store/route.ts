import { NextRequest, NextResponse } from 'next/server'
import { dbGetAll, dbGetOne, dbSet } from '@/lib/db'

// GET /api/store          → all rows as [{ key, value }]
// GET /api/store?key=K    → single row as { key, value } or null
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key')
    if (key) {
      return NextResponse.json(dbGetOne(key))
    }
    return NextResponse.json(dbGetAll())
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

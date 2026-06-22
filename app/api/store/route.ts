import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`DB query timed out after ${ms}ms`)), ms)
    ),
  ])
}

// GET /api/store          → all rows as [{ key, value }]
// GET /api/store?key=K    → single row as { key, value } or null
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key')

    if (key) {
      const row = await withTimeout(prisma.kvStore.findUnique({ where: { key } }), 8000)
      if (!row) return NextResponse.json(null)
      return NextResponse.json({ key: row.key, value: JSON.parse(row.value) })
    }

    const rows = await withTimeout(prisma.kvStore.findMany(), 8000)
    return NextResponse.json(rows.map(r => ({ key: r.key, value: JSON.parse(r.value) })))
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

    await withTimeout(
      prisma.kvStore.upsert({
        where: { key },
        create: { key, value: JSON.stringify(value) },
        update: { value: JSON.stringify(value) },
      }),
      8000
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/store POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

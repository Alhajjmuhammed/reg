import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/store          → all rows as [{ key, value }]
// GET /api/store?key=K    → single row as { key, value } or null
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')

  if (key) {
    const row = await prisma.kvStore.findUnique({ where: { key } })
    if (!row) return NextResponse.json(null)
    return NextResponse.json({ key: row.key, value: JSON.parse(row.value) })
  }

  const rows = await prisma.kvStore.findMany()
  return NextResponse.json(rows.map(r => ({ key: r.key, value: JSON.parse(r.value) })))
}

// POST /api/store   body: { key: string, value: unknown }
// Upserts a single key-value pair.
export async function POST(req: NextRequest) {
  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  await prisma.kvStore.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  })

  return NextResponse.json({ ok: true })
}

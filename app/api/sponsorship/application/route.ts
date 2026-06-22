import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { SponsorshipApplication } from '@/lib/types'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const row = await prisma.kvStore.findUnique({
    where: { key: 'masterclass_sponsorship_applications' },
  })
  const apps: SponsorshipApplication[] = row ? JSON.parse(row.value) : []
  const application = apps.find(a => a.id === id) ?? null

  return NextResponse.json({ application })
}

import { NextRequest, NextResponse } from 'next/server'
import { dbGet } from '@/lib/db'
import type { SponsorshipApplication } from '@/lib/types'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const apps = dbGet<SponsorshipApplication[]>('masterclass_sponsorship_applications', [])
  const application = apps.find(a => a.id === id) ?? null
  return NextResponse.json({ application })
}

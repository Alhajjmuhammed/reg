import { NextResponse } from 'next/server'
import { dbGetOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

type StoredParticipant = {
  seatNumbers?: number[]
  selectedPackage: string
  status: string
}

// Returns a flat map of { seatNumber: packageType } for all participants that
// have been assigned seats. Intentionally returns no PII — just seat numbers.
export async function GET() {
  try {
    const row = dbGetOne('masterclass_participants')
    const participants: StoredParticipant[] = (row?.value as StoredParticipant[]) ?? []
    const booked: Record<string, string> = {}
    for (const p of participants) {
      if (p.seatNumbers && p.status !== 'cancelled') {
        for (const n of p.seatNumbers) {
          booked[String(n)] = p.selectedPackage
        }
      }
    }
    return NextResponse.json(booked, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[api/booked-seats]', err)
    return NextResponse.json({}, { headers: { 'Cache-Control': 'no-store' } })
  }
}

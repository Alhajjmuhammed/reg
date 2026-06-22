import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Participant, SponsorshipApplication } from '@/lib/types'

const PAID_STATES = new Set(['CAPTURED', 'AUTHORISED', 'SUCCESS', 'PURCHASED'])

async function readKey<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.kvStore.findUnique({ where: { key } })
  if (!row) return fallback
  return JSON.parse(row.value) as T
}

async function writeKey(key: string, value: unknown): Promise<void> {
  await prisma.kvStore.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const orderRef: string =
      body.orderReference || body.reference || body._id || ''
    const paymentState: string =
      body._embedded?.payment?.[0]?.state || body.state || ''
    const merchantOrderRef: string =
      body.merchantAttributes?.merchantOrderReference || ''

    if (!PAID_STATES.has(paymentState)) {
      return NextResponse.json({ received: true })
    }

    // ── Sponsorship order (merchantOrderReference starts with 'spo-') ──────
    if (merchantOrderRef.startsWith('spo-')) {
      const apps = await readKey<SponsorshipApplication[]>('masterclass_sponsorship_applications', [])
      const idx = apps.findIndex(
        a => a.paymentReference === orderRef || `spo-${a.id}` === merchantOrderRef
      )

      if (idx !== -1 && apps[idx].paymentStatus !== 'paid') {
        apps[idx] = { ...apps[idx], status: 'confirmed', paymentStatus: 'paid' }
        await writeKey('masterclass_sponsorship_applications', apps)
      }

      return NextResponse.json({ received: true })
    }

    // ── Regular registration order ─────────────────────────────────────────
    const participants = await readKey<Participant[]>('masterclass_participants', [])
    const idx = participants.findIndex(
      p => p.paymentReference === orderRef || p.id === merchantOrderRef
    )

    if (idx !== -1 && participants[idx].status !== 'confirmed') {
      const now = new Date().toISOString()
      participants[idx] = {
        ...participants[idx],
        status: 'confirmed',
        paymentStatus: 'paid',
        amountPaid: participants[idx].totalAmount,
        lastUpdated: now,
      }
      await writeKey('masterclass_participants', participants)
    }
  } catch (e) {
    console.error('[webhook]', e)
  }

  // Always return 200 so NBC stops retrying
  return NextResponse.json({ received: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Participant, SponsorshipApplication } from '@/lib/types'

const PAID_STATES = new Set(['CAPTURED', 'AUTHORISED', 'SUCCESS', 'PURCHASED'])

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
      const { data } = await supabase
        .from('app_store')
        .select('value')
        .eq('key', 'masterclass_sponsorship_applications')
        .maybeSingle()

      const apps: SponsorshipApplication[] = (data?.value as SponsorshipApplication[]) || []
      const idx = apps.findIndex(
        a => a.paymentReference === orderRef || `spo-${a.id}` === merchantOrderRef
      )

      if (idx !== -1 && apps[idx].paymentStatus !== 'paid') {
        const now = new Date().toISOString()
        apps[idx] = { ...apps[idx], status: 'confirmed', paymentStatus: 'paid' }
        await supabase.from('app_store').upsert({
          key:        'masterclass_sponsorship_applications',
          value:      apps,
          updated_at: now,
        })
      }

      return NextResponse.json({ received: true })
    }

    // ── Regular registration order ─────────────────────────────────────────
    const { data } = await supabase
      .from('app_store')
      .select('value')
      .eq('key', 'masterclass_participants')
      .maybeSingle()

    const participants: Participant[] = (data?.value as Participant[]) || []
    const idx = participants.findIndex(
      p => p.paymentReference === orderRef || p.id === merchantOrderRef
    )

    if (idx !== -1 && participants[idx].status !== 'confirmed') {
      const now = new Date().toISOString()
      participants[idx] = {
        ...participants[idx],
        status:        'confirmed',
        paymentStatus: 'paid',
        amountPaid:    participants[idx].totalAmount,
        lastUpdated:   now,
      }
      await supabase.from('app_store').upsert({
        key:        'masterclass_participants',
        value:      participants,
        updated_at: now,
      })
    }
  } catch (e) {
    console.error('[webhook]', e)
  }

  // Always return 200 so NBC stops retrying
  return NextResponse.json({ received: true })
}

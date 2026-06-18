import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { complete3DSChallenge, PAID_STATES } from '@/lib/ngenius'
import type { SponsorshipApplication } from '@/lib/types'

async function readApps(): Promise<SponsorshipApplication[]> {
  const { data } = await supabase
    .from('app_store').select('value')
    .eq('key', 'masterclass_sponsorship_applications').maybeSingle()
  return (data?.value as SponsorshipApplication[]) || []
}

async function writeApps(apps: SponsorshipApplication[]): Promise<void> {
  await supabase.from('app_store').upsert({
    key: 'masterclass_sponsorship_applications',
    value: apps,
    updated_at: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { orderRef, paymentId, cres, applicationId } = await req.json() as {
      orderRef:      string
      paymentId:     string
      cres:          string
      applicationId: string
    }

    console.log('[3ds/complete] orderRef:', orderRef, 'paymentId:', paymentId)

    const result = await complete3DSChallenge(orderRef, paymentId, cres)
    console.log('[3ds/complete] final state:', result.state)

    if (PAID_STATES.has(result.state)) {
      // Confirm the application in Supabase
      const apps = await readApps()
      const idx  = apps.findIndex(a => a.id === applicationId || a.paymentReference === orderRef)
      if (idx !== -1) {
        apps[idx] = { ...apps[idx], status: 'confirmed', paymentStatus: 'paid' }
        await writeApps(apps)
      }
      return NextResponse.json({ success: true, state: result.state })
    }

    return NextResponse.json(
      { error: `Payment not completed (state: ${result.state})` },
      { status: 400 }
    )
  } catch (e) {
    console.error('[3ds/complete]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

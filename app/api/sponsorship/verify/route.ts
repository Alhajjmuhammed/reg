import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { SponsorshipApplication } from '@/lib/types'

const IDENTITY_URL = process.env.NGENIUS_IDENTITY_URL!
const API_URL      = process.env.NGENIUS_API_URL!
const API_KEY      = process.env.NGENIUS_API_KEY!
const OUTLET_REF   = process.env.NGENIUS_OUTLET_REF!
const REALM        = process.env.NGENIUS_REALM!

const PAID_STATES = new Set(['CAPTURED', 'AUTHORISED', 'SUCCESS', 'PURCHASED'])

async function getNGeniusToken(): Promise<string> {
  const res = await fetch(
    `${IDENTITY_URL}/auth/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  )
  if (!res.ok) throw new Error(`NGenius auth failed: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

async function readApps(): Promise<SponsorshipApplication[]> {
  const row = await prisma.kvStore.findUnique({
    where: { key: 'masterclass_sponsorship_applications' },
  })
  return row ? JSON.parse(row.value) : []
}

async function writeApps(apps: SponsorshipApplication[]): Promise<void> {
  await prisma.kvStore.upsert({
    where: { key: 'masterclass_sponsorship_applications' },
    create: { key: 'masterclass_sponsorship_applications', value: JSON.stringify(apps) },
    update: { value: JSON.stringify(apps) },
  })
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  console.log('[sponsorship/verify] ref:', ref)
  if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 })

  try {
    const token = await getNGeniusToken()

    const orderRes = await fetch(
      `${API_URL}/transactions/outlets/${OUTLET_REF}/orders/${ref}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.ni-payment.v2+json',
        },
      }
    )
    if (!orderRes.ok) throw new Error(`NGenius order fetch failed: ${orderRes.status}`)

    const order        = await orderRes.json()
    const paymentState = order._embedded?.payment?.[0]?.state || order.status || 'UNKNOWN'
    const merchantRef  = order.merchantAttributes?.merchantOrderReference || ''
    console.log('[sponsorship/verify] paymentState:', paymentState, 'merchantRef:', merchantRef)

    if (!PAID_STATES.has(paymentState)) {
      return NextResponse.json({ success: true, status: paymentState.toLowerCase() })
    }

    // Find and confirm the sponsorship application
    const apps = await readApps()
    const idx = apps.findIndex(
      a => a.paymentReference === ref || `spo-${a.id}` === merchantRef
    )

    if (idx !== -1 && apps[idx].paymentStatus !== 'paid') {
      apps[idx] = { ...apps[idx], status: 'confirmed', paymentStatus: 'paid' }
      await writeApps(apps)
      return NextResponse.json({ success: true, status: 'paid', application: apps[idx] })
    }

    const app = idx !== -1 ? apps[idx] : null
    return NextResponse.json({ success: true, status: 'paid', application: app })
  } catch (e) {
    console.error('[sponsorship/verify]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

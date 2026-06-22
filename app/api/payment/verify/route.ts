import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Participant } from '@/lib/types'

const IDENTITY_URL = process.env.NGENIUS_IDENTITY_URL!
const API_URL = process.env.NGENIUS_API_URL!
const API_KEY = process.env.NGENIUS_API_KEY!
const OUTLET_REF = process.env.NGENIUS_OUTLET_REF!
const REALM = process.env.NGENIUS_REALM!

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
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  const d = await res.json()
  return d.access_token as string
}

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

const PAID_STATES = new Set(['CAPTURED', 'AUTHORISED', 'SUCCESS', 'PURCHASED'])

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
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

    const order = await orderRes.json()
    const paymentState: string =
      order._embedded?.payment?.[0]?.state || order.status || 'UNKNOWN'
    const merchantOrderRef: string =
      order.merchantAttributes?.merchantOrderReference || ''

    if (!PAID_STATES.has(paymentState)) {
      return NextResponse.json({ success: true, status: paymentState.toLowerCase() })
    }

    // Mark participant as confirmed
    const participants = await readKey<Participant[]>('masterclass_participants', [])
    const idx = participants.findIndex(
      p => p.paymentReference === ref || p.id === merchantOrderRef
    )

    if (idx !== -1) {
      const now = new Date().toISOString()
      participants[idx] = {
        ...participants[idx],
        status: 'confirmed',
        paymentStatus: 'paid',
        amountPaid: participants[idx].totalAmount,
        lastUpdated: now,
      }
      await writeKey('masterclass_participants', participants)

      return NextResponse.json({
        success: true,
        status: 'paid',
        participant: participants[idx],
      })
    }

    return NextResponse.json({ success: true, status: 'paid' })
  } catch (e) {
    console.error('[verify]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

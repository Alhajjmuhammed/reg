import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import type { SponsorshipApplication } from '@/lib/types'

const IDENTITY_URL = process.env.NGENIUS_IDENTITY_URL!
const API_URL      = process.env.NGENIUS_API_URL!
const API_KEY      = process.env.NGENIUS_API_KEY!
const OUTLET_REF   = process.env.NGENIUS_OUTLET_REF!
const REALM        = process.env.NGENIUS_REALM!

function getBaseUrl(req: NextRequest): string {
  const host  = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') ||
                (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}`
}

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
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`NGenius auth failed (${res.status}): ${text}`)
  }
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

export async function POST(req: NextRequest) {
  const baseUrl = getBaseUrl(req)
  console.log('[sponsorship/create-order] baseUrl:', baseUrl)
  try {
    const body = await req.json()
    const { applicationData, tierPrice } = body as {
      applicationData: Omit<SponsorshipApplication, 'id' | 'invoiceNumber' | 'submittedAt' | 'status' | 'paymentStatus'>
      tierPrice: number
    }
    console.log('[sponsorship/create-order] tierPrice:', tierPrice, 'company:', applicationData.companyName)

    const apps = await readApps()
    const seq  = (apps.length + 1).toString().padStart(4, '0')
    const year = new Date().getFullYear()
    const now  = new Date().toISOString()

    // Build and save the application record first (so webhook can match it)
    const application: SponsorshipApplication = {
      ...applicationData,
      id:            uuidv4(),
      invoiceNumber: `SPO-${year}-${seq}`,
      submittedAt:   now,
      status:        'pending',
      paymentStatus: 'unpaid',
    }
    apps.push(application)
    await writeApps(apps)

    // Create NGenius order — charge includes 15% VAT
    const totalAmount = Math.round(tierPrice * 1.15)
    const token       = await getNGeniusToken()

    const orderRes = await fetch(
      `${API_URL}/transactions/outlets/${OUTLET_REF}/orders`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.ni-payment.v2+json',
          Accept:         'application/vnd.ni-payment.v2+json',
        },
        body: JSON.stringify({
          action: 'SALE',
          // TZS minor units (senti): multiply by 100
          amount: { currencyCode: 'TZS', value: totalAmount * 100 },
          merchantAttributes: {
            redirectUrl: `${baseUrl}/payment/sponsorship-callback`,
            cancelUrl:   `${baseUrl}/sponsorship`,
            merchantOrderReference: `spo-${application.id}`,
            skipConfirmationPage: false,
          },
          emailAddress: applicationData.billingEmail,
          billingAddress: {
            firstName: applicationData.contactName.split(' ')[0],
            lastName:  applicationData.contactName.split(' ').slice(1).join(' ') || '-',
          },
        }),
      }
    )

    if (!orderRes.ok) {
      const errText = await orderRes.text()
      throw new Error(`NGenius order failed (${orderRes.status}): ${errText}`)
    }

    const order      = await orderRes.json()
    const paymentUrl = order._links?.payment?.href as string
    const orderId    = order.reference as string

    console.log('[sponsorship/create-order] NGenius orderId:', orderId, 'paymentUrl:', paymentUrl)
    if (!paymentUrl) throw new Error('NGenius did not return a payment URL')

    // Store the NGenius order reference on the application so verify can match it
    const idx = apps.findIndex(a => a.id === application.id)
    if (idx !== -1) {
      apps[idx].paymentReference = orderId
      await writeApps(apps)
    }

    return NextResponse.json({
      success:       true,
      paymentUrl,
      orderId,
      applicationId: application.id,
      invoiceNumber: application.invoiceNumber,
    })
  } catch (e) {
    console.error('[sponsorship/create-order]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

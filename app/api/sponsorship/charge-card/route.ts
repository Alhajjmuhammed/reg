import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chargeCard, PAID_STATES } from '@/lib/ngenius'
import { v4 as uuidv4 } from 'uuid'
import type { SponsorshipApplication } from '@/lib/types'

function getBaseUrl(req: NextRequest): string {
  const host  = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') ||
                (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}`
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
  console.log('[charge-card] baseUrl:', baseUrl)

  try {
    const body = await req.json()
    const { applicationData, tierPrice, card, browserInfo } = body as {
      applicationData: Omit<SponsorshipApplication, 'id' | 'invoiceNumber' | 'submittedAt' | 'status' | 'paymentStatus'>
      tierPrice:       number
      card: {
        pan:    string
        expiry: string
        cvv:    string
        name:   string
      }
      browserInfo: Record<string, unknown>
    }

    // ── 1. Save application to SQLite ────────────────────────────────────────
    const apps = await readApps()
    const seq  = (apps.length + 1).toString().padStart(4, '0')
    const year = new Date().getFullYear()
    const now  = new Date().toISOString()

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
    console.log('[charge-card] application saved:', application.invoiceNumber)

    // ── 2. Convert expiry MM/YY → YYYY-MM ────────────────────────────────────
    const [mm, yy] = card.expiry.split('/')
    const expiryFormatted = `20${yy.trim()}-${mm.trim()}`

    // ── 3. One-stage payment ─────────────────────────────────────────────────
    const totalTZS = Math.round(tierPrice * 1.15)
    const chargeResult = await chargeCard({
      amountTZS:       totalTZS,
      pan:             card.pan.replace(/\s/g, ''),
      expiry:          expiryFormatted,
      cvv:             card.cvv,
      cardholderName:  card.name,
      email:           applicationData.billingEmail,
      merchantRef:     `spo-${application.id}`,
      notificationUrl: `${baseUrl}/api/sponsorship/3ds/notify`,
    })
    console.log('[charge-card] NGenius FULL response:', JSON.stringify(chargeResult, null, 2))

    const paymentId = chargeResult.reference  as string
    const orderRef  = chargeResult.orderReference as string

    // Store orderRef on application
    const idx = apps.findIndex(a => a.id === application.id)
    if (idx !== -1) { apps[idx].paymentReference = orderRef; await writeApps(apps) }

    // ── 4. Payment succeeded immediately (no 3DS) ────────────────────────────
    if (PAID_STATES.has(chargeResult.state)) {
      apps[idx !== -1 ? idx : apps.length - 1] = {
        ...apps[idx !== -1 ? idx : apps.length - 1],
        status: 'confirmed', paymentStatus: 'paid',
      }
      await writeApps(apps)
      return NextResponse.json({
        success:       true,
        applicationId: application.id,
        invoiceNumber: application.invoiceNumber,
      })
    }

    // ── 5. 3DS required — do device fingerprinting first ────────────────────
    if (chargeResult.state === 'AWAIT_3DS') {
      const ds2 = chargeResult['3ds2'] as Record<string, string> | undefined
      const threeDSMethodURL      = ds2?.threeDSMethodURL      || ''
      const threeDSServerTransID  = ds2?.threeDSServerTransID  || ''

      console.log('[charge-card] 3DS method URL:', threeDSMethodURL)

      return NextResponse.json({
        needs3DSMethod:      true,
        applicationId:       application.id,
        invoiceNumber:       application.invoiceNumber,
        orderRef,
        paymentId,
        threeDSMethodURL,
        threeDSServerTransID,
        methodNotifyUrl:     `${baseUrl}/api/sponsorship/3ds/method-notify`,
      })
    }

    // ── 6. Payment failed ────────────────────────────────────────────────────
    return NextResponse.json(
      { error: `Payment declined (state: ${chargeResult.state})` },
      { status: 400 }
    )
  } catch (e) {
    console.error('[charge-card]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { chargeCard, authenticate3DS2, PAID_STATES } from '@/lib/ngenius'
import { v4 as uuidv4 } from 'uuid'
import type { SponsorshipApplication } from '@/lib/types'

function getBaseUrl(req: NextRequest): string {
  const host  = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') ||
                (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}`
}

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
  const baseUrl = getBaseUrl(req)
  console.log('[charge-card] baseUrl:', baseUrl)

  try {
    const body = await req.json()
    const { applicationData, tierPrice, card, browserInfo } = body as {
      applicationData: Omit<SponsorshipApplication, 'id' | 'invoiceNumber' | 'submittedAt' | 'status' | 'paymentStatus'>
      tierPrice:       number
      card: {
        pan:    string
        expiry: string  // MM/YY from form input
        cvv:    string
        name:   string
      }
      browserInfo: Record<string, unknown>
    }

    // ── 1. Save application to Supabase ──────────────────────────────────────
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
    console.log('[charge-card] NGenius state:', chargeResult.state, 'paymentId:', chargeResult.reference)

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

    // ── 5. 3DS required — attempt frictionless authentication ────────────────
    if (chargeResult.state === 'AWAIT_3DS') {
      let authResult: Record<string, unknown> | null = null

      const browserIp =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') || '127.0.0.1'

      try {
        authResult = await authenticate3DS2(orderRef, paymentId, {
          notificationUrl:          `${baseUrl}/api/sponsorship/3ds/notify`,
          browserIp,
          browserAcceptHeader:      (browserInfo.acceptHeader   as string) || 'text/html,*/*',
          browserLanguage:          (browserInfo.language        as string) || 'en',
          browserScreenHeight:      String(browserInfo.screenHeight  ?? 768),
          browserScreenWidth:       String(browserInfo.screenWidth   ?? 1366),
          browserTz:                String(browserInfo.timeZoneOffset ?? 0),
          browserColorDepth:        String(browserInfo.colorDepth     ?? 24),
          browserUserAgent:         (browserInfo.userAgent       as string) || '',
          browserJavaEnabled:       false,
          browserJavascriptEnabled: true,
        })
        console.log('[charge-card] 3DS auth FULL:', JSON.stringify(authResult, null, 2))
      } catch (e) {
        console.warn('[charge-card] 3DS auth error:', e)
      }

      // Frictionless — payment done
      if (authResult && PAID_STATES.has(authResult.state as string)) {
        const i = apps.findIndex(a => a.id === application.id)
        if (i !== -1) { apps[i] = { ...apps[i], status: 'confirmed', paymentStatus: 'paid' }; await writeApps(apps) }
        return NextResponse.json({
          success:       true,
          applicationId: application.id,
          invoiceNumber: application.invoiceNumber,
        })
      }

      // Challenge required — return ACS data for the iframe
      if (authResult && authResult.state === 'AWAIT_3DS') {
        const links    = authResult._links          as Record<string, { href: string }> | undefined
        const authData = authResult.authenticationData as Record<string, string> | undefined
        const tds      = authResult['3ds']          as Record<string, string> | undefined

        // Try every known NGenius field path for the ACS URL and creq
        const acsUrl =
          tds?.acsUrl          || tds?.acsURL          ||
          authData?.acsUrl     || authData?.acsURL      ||
          links?.['cnp:3ds2-challenge']?.href           || ''

        const creq =
          tds?.creq            ||
          authData?.creq       || ''

        console.log('[charge-card] 3DS acsUrl:', acsUrl, 'creq len:', creq.length)

        return NextResponse.json({
          needs3DSChallenge: true,
          applicationId:     application.id,
          invoiceNumber:     application.invoiceNumber,
          orderRef,
          paymentId,
          acsUrl,
          creq,
          notifyUrl: `${baseUrl}/api/sponsorship/3ds/notify`,
        })
      }

      // 3DS state unknown — return challenge attempt anyway
      return NextResponse.json({
        needs3DSChallenge: true,
        applicationId:     application.id,
        invoiceNumber:     application.invoiceNumber,
        orderRef,
        paymentId,
        acsUrl: '', creq: '', sessionData: '',
        notifyUrl: `${baseUrl}/api/sponsorship/3ds/notify`,
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

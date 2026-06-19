import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authenticate3DS2, PAID_STATES } from '@/lib/ngenius'
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
  try {
    const { orderRef, paymentId, applicationId, invoiceNumber, browserInfo, methodCompleted } =
      await req.json() as {
        orderRef:        string
        paymentId:       string
        applicationId:   string
        invoiceNumber:   string
        browserInfo:     Record<string, unknown>
        methodCompleted: boolean
      }

    const browserIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') || '127.0.0.1'

    const threeDSCompInd: 'Y' | 'N' = methodCompleted ? 'Y' : 'N'

    console.log('[authenticate] orderRef:', orderRef, 'compInd:', threeDSCompInd)

    const authResult = await authenticate3DS2(orderRef, paymentId, {
      notificationUrl: '',  // omitted — NGenius uses outlet-configured URL
      threeDSCompInd,
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

    console.log('[authenticate] state:', authResult.state)

    // Frictionless — payment done immediately
    if (PAID_STATES.has(authResult.state as string)) {
      const apps = await readApps()
      const i = apps.findIndex(a => a.id === applicationId)
      if (i !== -1) {
        apps[i] = { ...apps[i], status: 'confirmed', paymentStatus: 'paid' }
        await writeApps(apps)
      }
      return NextResponse.json({ success: true, applicationId, invoiceNumber })
    }

    // Challenge required
    if (authResult.state === 'AWAIT_3DS') {
      console.log('[authenticate] challenge response:', JSON.stringify(authResult, null, 2))

      const links    = authResult._links             as Record<string, { href: string }> | undefined
      const authData = authResult.authenticationData as Record<string, string> | undefined
      const tds      = authResult['3ds']             as Record<string, string> | undefined

      const acsUrl =
        tds?.acsUrl      || tds?.acsURL      ||
        authData?.acsUrl || authData?.acsURL  ||
        links?.['cnp:3ds2-challenge']?.href   || ''

      const creq = tds?.creq || authData?.creq || ''

      if (!acsUrl || !creq) {
        console.error('[authenticate] missing acsUrl/creq:', JSON.stringify(authResult))
        return NextResponse.json(
          { error: 'Bank verification data missing. Please try again.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        needs3DSChallenge: true,
        applicationId,
        invoiceNumber,
        orderRef,
        paymentId,
        acsUrl,
        creq,
        notifyUrl: `${baseUrl}/api/sponsorship/3ds/notify`,
      })
    }

    console.error('[authenticate] unexpected state:', authResult.state)
    return NextResponse.json(
      { error: `Unexpected authentication response. Please try again.` },
      { status: 400 }
    )
  } catch (e) {
    console.error('[authenticate]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '3DS authentication failed' },
      { status: 500 }
    )
  }
}

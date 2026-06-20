import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

// Test route — GET /api/email/test?to=someone@example.com
// Only available in non-production environments
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')

  if (!to) {
    return NextResponse.json({ error: 'Pass ?to=your@email.com in the URL' }, { status: 400 })
  }

  console.log('[email/test] GMAIL_USER:', process.env.GMAIL_USER)
  console.log('[email/test] GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD)
  console.log('[email/test] Sending test email to:', to)

  const result = await sendEmail({
    type: 'registration_confirmation',
    to,
    name: 'Test User',
    eventName: 'HAMINASS Executive Masterclass',
    eventDate: '2025-09-15',
    eventTime: '9:00 AM',
    eventVenue: 'Julius Nyerere International Convention Centre',
    eventAddress: 'Dar es Salaam, Tanzania',
    selectedPackage: 'Standard',
    totalAmount: 380000,
    currency: 'TZS',
    paymentMethod: 'Lipa Number',
    receiptNumber: 'MC202506-TEST',
  })

  console.log('[email/test] Result:', result)

  return NextResponse.json(result)
}

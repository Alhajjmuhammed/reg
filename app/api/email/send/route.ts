import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, type EmailData } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const data: EmailData = await req.json()

    if (!data.to || !data.type || !data.name) {
      return NextResponse.json({ error: 'Missing required fields: to, type, name' }, { status: 400 })
    }

    console.log(`[email] Sending "${data.type}" to ${data.to}`)
    const result = await sendEmail(data)

    if (!result.success) {
      console.error(`[email] Failed to send "${data.type}" to ${data.to}:`, result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log(`[email] Sent "${data.type}" to ${data.to} OK`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[email] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

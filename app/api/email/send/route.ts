import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, type EmailData } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const data: EmailData = await req.json()

    if (!data.to || !data.type || !data.name) {
      return NextResponse.json({ error: 'Missing required fields: to, type, name' }, { status: 400 })
    }

    const result = await sendEmail(data)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/email/send]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

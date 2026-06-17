import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/crypto'
import type { Participant, UserAccount } from '@/lib/types'

const IDENTITY_URL = process.env.NGENIUS_IDENTITY_URL!
const API_URL = process.env.NGENIUS_API_URL!
const API_KEY = process.env.NGENIUS_API_KEY!
const OUTLET_REF = process.env.NGENIUS_OUTLET_REF!
const REALM = process.env.NGENIUS_REALM!
const SITE_URL = process.env.SITE_URL || 'https://e-masterclass.eopsprimax.com'

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

async function readKey<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from('app_store')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (error || !data) return fallback
  return data.value as T
}

async function writeKey(key: string, value: unknown): Promise<void> {
  await supabase
    .from('app_store')
    .upsert({ key, value, updated_at: new Date().toISOString() })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, participant: pData, password } = body as {
      amount: number
      participant: Partial<Participant>
      password?: string
    }

    if (!amount || !pData) {
      return NextResponse.json({ error: 'Missing amount or participant data' }, { status: 400 })
    }

    const participantId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const receiptNumber = `MC${Date.now().toString(36).toUpperCase()}`
    const now = new Date().toISOString()

    // Get NGenius access token
    const token = await getNGeniusToken()

    // Create NGenius order — TZS: use raw value (no minor-unit multiplication)
    const orderRes = await fetch(
      `${API_URL}/transactions/outlets/${OUTLET_REF}/orders`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.ni-payment.v2+json',
          Accept: 'application/vnd.ni-payment.v2+json',
        },
        body: JSON.stringify({
          action: 'SALE',
          // NGenius uses minor units for TZS (senti): 1 TZS = 100 senti
          amount: { currencyCode: 'TZS', value: amount * 100 },
          merchantAttributes: {
            redirectUrl: `${SITE_URL}/payment/callback`,
            cancelUrl: `${SITE_URL}/payment/cancelled`,
            merchantOrderReference: participantId,
            skipConfirmationPage: false,
          },
          emailAddress: pData.email,
          billingAddress: {
            firstName: (pData.fullName || '').split(' ')[0],
            lastName: (pData.fullName || '').split(' ').slice(1).join(' ') || '-',
          },
        }),
      }
    )

    if (!orderRes.ok) {
      const errText = await orderRes.text()
      throw new Error(`NGenius order failed (${orderRes.status}): ${errText}`)
    }

    const order = await orderRes.json()
    const paymentUrl: string = order._links?.payment?.href
    const orderId: string = order.reference

    if (!paymentUrl) throw new Error('NGenius did not return a payment URL')

    // Build participant record
    const newParticipant: Participant = {
      id: participantId,
      receiptNumber,
      fullName: pData.fullName || '',
      phoneNumber: pData.phoneNumber || '',
      whatsappNumber: pData.whatsappNumber || '',
      email: pData.email || '',
      gender: pData.gender,
      country: pData.country,
      city: pData.city || '',
      occupation: pData.occupation || '',
      organizationName: pData.organizationName,
      businessType: pData.businessType || '',
      yearsOfExperience: pData.yearsOfExperience,
      trainingInterests: pData.trainingInterests || [],
      bookingType: pData.bookingType || 'individual',
      groupSeats: pData.groupSeats,
      groupMembers: pData.groupMembers,
      selectedPackage: pData.selectedPackage || 'standard',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      totalAmount: amount,
      paymentMethod: pData.paymentMethod,
      paymentReference: orderId,
      couponCode: pData.couponCode,
      discountApplied: pData.discountApplied,
      notes: pData.notes,
      status: 'pending',
      registrationDate: now,
      lastUpdated: now,
    }

    // Save participant to Supabase
    const participants = await readKey<Participant[]>('masterclass_participants', [])
    participants.push(newParticipant)
    await writeKey('masterclass_participants', participants)

    // Create user account if password provided
    if (password && pData.email) {
      const accounts = await readKey<UserAccount[]>('masterclass_user_accounts', [])
      const exists = accounts.findIndex(a => a.email.toLowerCase() === pData.email!.toLowerCase())
      const newAccount: UserAccount = {
        id: `ua-${Date.now()}`,
        email: pData.email,
        passwordHash: hashPassword(password),
        participantId,
        createdAt: now,
      }
      if (exists === -1) {
        accounts.push(newAccount)
      } else {
        accounts[exists] = newAccount
      }
      await writeKey('masterclass_user_accounts', accounts)
    }

    return NextResponse.json({ success: true, paymentUrl, orderId, participantId, receiptNumber })
  } catch (e) {
    console.error('[create-order]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

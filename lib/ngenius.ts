const IDENTITY_URL = process.env.NGENIUS_IDENTITY_URL!
const API_URL      = process.env.NGENIUS_API_URL!
const API_KEY      = process.env.NGENIUS_API_KEY!
const OUTLET_REF   = process.env.NGENIUS_OUTLET_REF!
const REALM        = process.env.NGENIUS_REALM!

export async function getToken(): Promise<string> {
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
  if (!res.ok) throw new Error(`NGenius auth failed (${res.status})`)
  const d = await res.json()
  return d.access_token as string
}

// ── One-stage payment: creates order + submits card in one call ───────────────
export async function chargeCard(params: {
  amountTZS:       number   // major units (TZS) — will be multiplied by 100
  pan:             string
  expiry:          string   // YYYY-MM  e.g. "2028-06"
  cvv:             string
  cardholderName:  string
  email:           string
  merchantRef:     string   // e.g. "spo-{appId}"
  notificationUrl: string   // 3DS POST-back URL on our server
}) {
  const token = await getToken()
  const res = await fetch(
    `${API_URL}/transactions/outlets/${OUTLET_REF}/payment/card`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.ni-payment.v2+json',
        Accept:         'application/vnd.ni-payment.v2+json',
      },
      body: JSON.stringify({
        order: {
          action: 'PURCHASE',
          amount: { currencyCode: 'TZS', value: params.amountTZS * 100 },
          merchantAttributes: {
            merchantOrderReference: params.merchantRef,
          },
          emailAddress: params.email,
        },
        payment: {
          pan:             params.pan,
          expiry:          params.expiry,
          cvv:             params.cvv,
          cardholderName:  params.cardholderName,
        },
      }),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    let message = `Payment failed (${res.status})`
    try {
      const errJson = JSON.parse(errText)
      if (errJson.errors?.[0]?.localizedMessage) message = errJson.errors[0].localizedMessage
      else if (errJson.message) message = errJson.message
    } catch { /* non-JSON error body */ }
    console.error('[ngenius chargeCard]', res.status, errText)
    throw new Error(message)
  }
  return await res.json()
}

// ── 3DS2: initiate authentication after initial AWAIT_3DS ────────────────────
export async function authenticate3DS2(
  orderRef:    string,
  paymentId:   string,
  params: {
    notificationUrl:       string
    browserIp:             string
    browserAcceptHeader:   string
    browserLanguage:       string
    browserScreenHeight:   string
    browserScreenWidth:    string
    browserTz:             string
    browserColorDepth:     string
    browserUserAgent:      string
    browserJavaEnabled:    boolean
    browserJavascriptEnabled: boolean
  }
) {
  const token = await getToken()
  const body = {
    deviceChannel:      'BRW',
    notifStatus:        'N',
    threeDSCompInd:     'N',
    challengeWindowSize:'05',
    ...params,
  }
  console.log('[ngenius authenticate3DS2] body:', JSON.stringify(body))
  const res = await fetch(
    `${API_URL}/transactions/outlets/${OUTLET_REF}/orders/${orderRef}/payments/${paymentId}/card/3ds2/authentications`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.ni-payment.v2+json',
        Accept:         'application/vnd.ni-payment.v2+json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    let message = `Authentication failed (${res.status})`
    try {
      const errJson = JSON.parse(errText)
      if (errJson.errors?.[0]?.localizedMessage) message = errJson.errors[0].localizedMessage
      else if (errJson.message) message = errJson.message
    } catch { /* non-JSON */ }
    console.error('[ngenius 3DS auth]', res.status, errText)
    throw new Error(message)
  }
  return await res.json()
}

// ── 3DS2: complete challenge after user enters OTP ────────────────────────────
export async function complete3DSChallenge(
  orderRef:  string,
  paymentId: string,
  cres:      string
) {
  const token = await getToken()
  const res = await fetch(
    `${API_URL}/transactions/outlets/${OUTLET_REF}/orders/${orderRef}/payments/${paymentId}/card/3ds2/challenge-response`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.ni-payment.v2+json',
        Accept:         'application/vnd.ni-payment.v2+json',
      },
      body: JSON.stringify({ cres }),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    let message = `Verification failed (${res.status})`
    try {
      const errJson = JSON.parse(errText)
      if (errJson.errors?.[0]?.localizedMessage) message = errJson.errors[0].localizedMessage
      else if (errJson.message) message = errJson.message
    } catch { /* non-JSON */ }
    console.error('[ngenius 3DS complete]', res.status, errText)
    throw new Error(message)
  }
  return await res.json()
}

// ── Get payment state by order ref ───────────────────────────────────────────
export async function getOrderState(orderRef: string): Promise<string> {
  const token = await getToken()
  const res = await fetch(
    `${API_URL}/transactions/outlets/${OUTLET_REF}/orders/${orderRef}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.ni-payment.v2+json' } }
  )
  if (!res.ok) throw new Error(`Get order failed: ${res.status}`)
  const d = await res.json()
  return d._embedded?.payment?.[0]?.state || d.state || 'UNKNOWN'
}

export const PAID_STATES = new Set(['PURCHASED', 'AUTHORISED', 'CAPTURED'])

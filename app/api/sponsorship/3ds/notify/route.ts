import { NextRequest, NextResponse } from 'next/server'

// The ACS (bank's 3DS page) POSTs to this URL after the user completes the OTP challenge.
// It sends `cres` (challenge response) as form data.
// We return an HTML page that forwards the cres to the parent window via postMessage,
// so the sponsorship modal can complete the payment without any redirect.

export async function POST(req: NextRequest) {
  let cres = ''
  let threeDSSessionData = ''

  try {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await req.formData()
      cres              = (form.get('cres')              as string) || ''
      threeDSSessionData = (form.get('threeDSSessionData') as string) || ''
    } else {
      const body = await req.json().catch(() => ({}))
      cres               = body.cres              || ''
      threeDSSessionData = body.threeDSSessionData || ''
    }
  } catch {
    // ignore parse errors
  }

  console.log('[3ds/notify] cres received, length:', cres.length)

  // Return an HTML page that sends the cres back to the parent window via postMessage.
  // The sponsorship modal listens for this message and calls /api/sponsorship/3ds/complete.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script>
  try {
    window.parent.postMessage(
      { type: '3ds_challenge_done', cres: ${JSON.stringify(cres)}, sessionData: ${JSON.stringify(threeDSSessionData)} },
      '*'
    );
  } catch(e) {}
</script>
<p style="font-family:sans-serif;color:#666;text-align:center;margin-top:40px">
  Completing verification…
</p>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

// Also handle GET (some banks redirect instead of POST)
export async function GET(req: NextRequest) {
  const cres              = req.nextUrl.searchParams.get('cres')              || ''
  const threeDSSessionData = req.nextUrl.searchParams.get('threeDSSessionData') || ''
  console.log('[3ds/notify GET] cres received, length:', cres.length)

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script>
  try {
    window.parent.postMessage(
      { type: '3ds_challenge_done', cres: ${JSON.stringify(cres)}, sessionData: ${JSON.stringify(threeDSSessionData)} },
      '*'
    );
  } catch(e) {}
</script>
<p style="font-family:sans-serif;color:#666;text-align:center;margin-top:40px">
  Completing verification…
</p>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

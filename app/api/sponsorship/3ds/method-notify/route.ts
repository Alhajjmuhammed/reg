import { NextResponse } from 'next/server'

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body>
<script>
  try { window.parent.postMessage({ type: '3ds_method_done' }, '*') } catch(e) {}
</script>
</body>
</html>`

export async function POST() {
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
}
export async function GET() {
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
}

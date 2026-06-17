'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Copy, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ShareQRCode() {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUrl(window.location.origin)
  }, [])

  const registrationUrl = `${url}/#register`

  const downloadQR = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'registration-qr.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(registrationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [registrationUrl])

  const shareLink = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Register for the Masterclass', url: registrationUrl })
    } else {
      await copyLink()
    }
  }, [registrationUrl, copyLink])

  if (!url) return null

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 max-w-2xl mx-auto">
      {/* QR Code */}
      <div ref={qrRef} className="shrink-0 rounded-xl border border-border bg-white p-3">
        <QRCodeCanvas
          value={registrationUrl}
          size={140}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Text + Buttons */}
      <div className="flex-1 text-center sm:text-left space-y-3">
        <div>
          <p className="font-semibold text-foreground text-lg">Share with a Friend</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scan this QR code or share the link — invite colleagues to register too.
          </p>
        </div>
        <p className="text-xs font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1 break-all">
          {registrationUrl}
        </p>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <Button size="sm" onClick={downloadQR} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download QR
          </Button>
          <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button size="sm" variant="outline" onClick={shareLink} className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}

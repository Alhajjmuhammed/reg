'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Building2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import type { SponsorshipApplication } from '@/lib/types'

type Status = 'loading' | 'paid' | 'failed'

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-TZ').format(n) + ' TZS'
}

function CallbackContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus]           = useState<Status>('loading')
  const [application, setApplication] = useState<SponsorshipApplication | null>(null)
  const [errorMsg, setErrorMsg]       = useState('')

  useEffect(() => {
    const ref =
      params.get('ref') ||
      params.get('order-ref') ||
      params.get('orderRef') ||
      params.get('order_ref')

    if (!ref) {
      setStatus('failed')
      setErrorMsg('Payment reference not found. Please contact support.')
      return
    }

    fetch(`/api/sponsorship/verify?ref=${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'paid') {
          setStatus('paid')
          if (data.application) setApplication(data.application)
        } else {
          setStatus('failed')
          setErrorMsg(
            `Payment not completed (status: ${data.status ?? 'unknown'}). ` +
            'If you were charged, please contact billings@haminass.com'
          )
        }
      })
      .catch(() => {
        setStatus('failed')
        setErrorMsg('Could not verify payment. Please contact billings@haminass.com if you were charged.')
      })
  }, [params])

  return (
    <div className="flex min-h-[calc(100vh-130px)] items-center justify-center px-4 py-16">

      {status === 'loading' && (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">Confirming your sponsorship payment…</p>
          <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
        </div>
      )}

      {status === 'paid' && (
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-6 shadow-lg">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Sponsorship Confirmed!</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Your card payment was successful. Welcome as a sponsor of the Executive Masterclass!
            </p>
          </div>

          {application && (
            <div className="rounded-lg bg-secondary/30 border border-border p-4 text-left space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium text-right">{application.companyName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Contact</span>
                <span className="font-medium text-right">{application.contactName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Package</span>
                <span className="font-semibold text-right text-primary">{application.tierName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Invoice No.</span>
                <span className="font-mono font-bold text-primary">{application.invoiceNumber}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2.5">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-primary text-base">
                  {fmtCurrency(Math.round(application.amount * 1.15))}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-sm text-left space-y-1">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Building2 className="h-4 w-4" />
              What happens next?
            </div>
            <p className="text-muted-foreground">
              Our sponsorship team will contact you within 1–2 business days with your
              sponsorship package details and activation plan.
            </p>
          </div>

          <Button onClick={() => router.push('/sponsorship')} className="w-full gap-2" size="lg">
            Back to Sponsorship Page
          </Button>
        </div>
      )}

      {status === 'failed' && (
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-8 text-center space-y-6 shadow-lg">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment Not Completed</h1>
            <p className="text-muted-foreground mt-2 text-sm">{errorMsg}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/sponsorship')} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}

export default function SponsorshipCallbackPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-130px)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
      <SiteFooter />
    </div>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail, LayoutDashboard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import type { Participant } from '@/lib/types'

type Status = 'loading' | 'paid' | 'failed'

function CallbackContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // NGenius appends ?ref=ORDER_REF to the redirect URL
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

    fetch(`/api/payment/verify?ref=${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'paid') {
          setStatus('paid')
          if (data.participant) {
            setParticipant(data.participant as Participant)
            // Auto-set session so they go straight to dashboard
            try {
              localStorage.setItem(
                'masterclass_current_user',
                JSON.stringify({ email: data.participant.email, participantId: data.participant.id })
              )
            } catch {}
          }
        } else {
          setStatus('failed')
          setErrorMsg(`Payment not completed (status: ${data.status ?? 'unknown'}). If you were charged, please contact support.`)
        }
      })
      .catch(() => {
        setStatus('failed')
        setErrorMsg('Could not verify payment. Please contact support if you were charged.')
      })
  }, [params])

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ').format(n)

  return (
    <div className="flex min-h-[calc(100vh-130px)] items-center justify-center px-4 py-16">
      {status === 'loading' && (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-foreground">Verifying your payment…</p>
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
            <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
            <p className="text-muted-foreground mt-2">
              Your registration is confirmed. Welcome to the Executive Masterclass!
            </p>
          </div>

          {participant && (
            <div className="rounded-lg bg-secondary/30 border border-border p-4 text-left space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-right">{participant.fullName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Receipt No.</span>
                <span className="font-mono font-bold text-primary">{participant.receiptNumber}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2.5">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-primary text-base">
                  TZS {fmt(participant.totalAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-sm text-left space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Mail className="h-4 w-4" />
              Check your email
            </div>
            <p className="text-muted-foreground">
              A confirmation with your registration details and receipt has been sent to your email address.
            </p>
          </div>

          <Button
            onClick={() => router.push('/account/dashboard')}
            className="w-full gap-2"
            size="lg"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to My Dashboard
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
            <h1 className="text-2xl font-bold text-foreground">Payment Not Completed</h1>
            <p className="text-muted-foreground mt-2 text-sm">{errorMsg}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/#register')} className="w-full gap-2">
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

export default function PaymentCallbackPage() {
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

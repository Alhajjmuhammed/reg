'use client'

import { useRouter } from 'next/navigation'
import { XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export default function PaymentCancelledPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-[calc(100vh-130px)] items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-6 shadow-lg">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <XCircle className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Cancelled</h1>
            <p className="text-muted-foreground mt-2">
              You cancelled the payment. Your registration has not been confirmed yet.
            </p>
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
      </div>
      <SiteFooter />
    </div>
  )
}

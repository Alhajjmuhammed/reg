'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search, CheckCircle2, Clock, XCircle, Users,
  CreditCard, Package as PackageIcon, MapPin, Mail, Phone, Calendar,
  ArrowLeft, Download, Share2, Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { getParticipants, getAllPackages } from '@/lib/store'
import type { Package, Participant, ParticipantStatus, PaymentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<ParticipantStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string; desc: string }> = {
  confirmed: {
    label: 'Confirmed', icon: CheckCircle2,
    color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30',
    desc: 'Your seat is confirmed. See you at the event!',
  },
  pending: {
    label: 'Pending Review', icon: Clock,
    color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    desc: 'Your registration is being reviewed. Payment confirmation may be pending.',
  },
  cancelled: {
    label: 'Cancelled', icon: XCircle,
    color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30',
    desc: 'Your registration has been cancelled. Contact support for assistance.',
  },
  waitlist: {
    label: 'On Waitlist', icon: Users,
    color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30',
    desc: "You're on the waitlist. We'll notify you when a seat becomes available.",
  },
}

const paymentConfig: Record<PaymentStatus, { label: string; color: string }> = {
  paid: { label: 'Fully Paid', color: 'text-green-500' },
  partial: { label: 'Partial Payment', color: 'text-amber-500' },
  unpaid: { label: 'Unpaid', color: 'text-red-500' },
  refunded: { label: 'Refunded', color: 'text-purple-500' },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount)
}

export default function MyRegistrationPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Participant | null | undefined>(undefined)
  const [searched, setSearched] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    setPackages(getAllPackages())
  }, [])

  const handleSearch = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    const participants = getParticipants()
    const found = participants.find(
      p =>
        p.email.toLowerCase() === q ||
        p.receiptNumber?.toLowerCase() === q ||
        p.phoneNumber.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    )
    setResult(found || null)
    setSearched(true)
  }

  const pkg = result ? packages.find(p => p.id === result.selectedPackage) : null
  const status = result ? statusConfig[result.status] : null
  const payment = result ? paymentConfig[result.paymentStatus] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="eOpsprimax" className="h-8 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Receipt className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">My Registration</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email address, phone number, or receipt number to view your registration status
          </p>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg shadow-black/5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Email / Phone / Receipt Number</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="e.g. john@example.com or MC2024-ABC123"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={!query.trim()}>
                  <Search className="mr-2 h-4 w-4" />
                  Look up
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your receipt number was provided in your confirmation after payment.
            </p>
          </div>
        </div>

        {/* No result */}
        {searched && result === null && (
          <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">No registration found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We couldn&apos;t find a registration matching <strong>{query}</strong>.
              Please double-check and try again, or{' '}
              <Link href="/#register" className="text-primary underline-offset-4 hover:underline">
                register here
              </Link>
              .
            </p>
          </div>
        )}

        {/* Result */}
        {result && status && payment && (
          <div className="mt-6 space-y-4">
            {/* Status Banner */}
            <div className={cn('rounded-xl border p-5 flex items-start gap-4', status.bg, status.border)}>
              <status.icon className={cn('h-6 w-6 mt-0.5 shrink-0', status.color)} />
              <div>
                <p className={cn('font-semibold text-base', status.color)}>{status.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{status.desc}</p>
              </div>
            </div>

            {/* Registration Card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Receipt header */}
              <div className="border-b border-border bg-secondary/30 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/images/logo.png" alt="eOpsprimax" className="h-5 w-auto object-contain" />
                </div>
                {result.receiptNumber && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Receipt</p>
                    <p className="font-mono text-sm font-bold text-primary">{result.receiptNumber}</p>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-5">
                {/* Participant */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Participant Details
                  </h3>
                  <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {result.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{result.fullName}</p>
                        <p className="text-xs text-muted-foreground">{result.occupation}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{result.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{result.phoneNumber}</span>
                      </div>
                      {(result.city || result.country) && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{[result.city, result.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </dl>
                </div>

                {/* Package & Booking */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Booking Details
                  </h3>
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground flex items-center gap-1.5 mb-0.5">
                        <PackageIcon className="h-3.5 w-3.5" /> Package
                      </dt>
                      <dd className="font-semibold text-foreground">{pkg?.name ?? result.selectedPackage}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground flex items-center gap-1.5 mb-0.5">
                        <Users className="h-3.5 w-3.5" /> Booking Type
                      </dt>
                      <dd className="font-semibold text-foreground capitalize">{result.bookingType}</dd>
                    </div>
                    {result.seatNumbers && result.seatNumbers.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground mb-0.5">Assigned Seat(s)</dt>
                        <dd className="font-semibold text-foreground font-mono">
                          {result.seatNumbers.map(s => {
                            const row = String.fromCharCode(65 + Math.floor((s - 1) / 10))
                            const seat = ((s - 1) % 10) + 1
                            return `${row}${seat}`
                          }).join(', ')}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground flex items-center gap-1.5 mb-0.5">
                        <Calendar className="h-3.5 w-3.5" /> Registered On
                      </dt>
                      <dd className="font-semibold text-foreground">
                        {new Date(result.registrationDate).toLocaleDateString('en-TZ', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </dd>
                    </div>
                    {result.organizationName && (
                      <div>
                        <dt className="text-muted-foreground mb-0.5">Organization</dt>
                        <dd className="font-semibold text-foreground">{result.organizationName}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Group Members */}
                {result.bookingType === 'group' && result.groupMembers && result.groupMembers.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Group Members
                      {result.groupSeats && <span className="ml-1 normal-case font-normal">({result.groupSeats} seats)</span>}
                    </h3>
                    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden text-sm">
                      {result.groupMembers.map((member, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-card">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 shrink-0 text-xs font-bold text-primary">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{member.name}</p>
                            <div className="flex gap-3 mt-0.5">
                              {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                              {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      You can update member details in your <a href="/account/dashboard" className="text-primary underline-offset-4 hover:underline">account dashboard</a>.
                    </p>
                  </div>
                )}

                {/* Payment */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Payment Summary
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" /> Payment Status
                      </dt>
                      <dd className={cn('font-semibold', payment.color)}>{payment.label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Amount Paid</dt>
                      <dd className="font-semibold text-foreground">TZS {formatCurrency(result.amountPaid)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <dt className="font-medium text-foreground">Total Amount</dt>
                      <dd className="text-xl font-bold text-primary">TZS {formatCurrency(result.totalAmount)}</dd>
                    </div>
                    {result.paymentStatus === 'partial' && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Balance Due</dt>
                        <dd className="font-bold text-amber-500">
                          TZS {formatCurrency(result.totalAmount - result.amountPaid)}
                        </dd>
                      </div>
                    )}
                    {result.paymentReference && (
                      <div className="flex justify-between text-xs">
                        <dt className="text-muted-foreground">Reference</dt>
                        <dd className="font-mono text-foreground">{result.paymentReference}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Coupon */}
                {result.discountApplied && result.discountApplied > 0 && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm flex justify-between">
                    <span className="text-green-600 dark:text-green-400">
                      Coupon discount applied ({result.couponCode})
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      -TZS {formatCurrency(result.discountApplied)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Download className="mr-2 h-4 w-4" />
                Print / Save Receipt
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const text = `My Executive Masterclass Registration\n\nName: ${result.fullName}\nReceipt: ${result.receiptNumber || 'N/A'}\nPackage: ${pkg?.name ?? result.selectedPackage}\nStatus: ${status.label}\nAmount: TZS ${formatCurrency(result.totalAmount)}`
                  navigator.clipboard.writeText(text)
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copy Details
              </Button>
            </div>

            {/* Contact support if issues */}
            {(result.status === 'pending' || result.paymentStatus === 'partial') && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-center">
                <p className="text-amber-600 dark:text-amber-400">
                  Need help with your registration?{' '}
                  <Link href="/#register" className="font-semibold underline underline-offset-4">
                    Contact our support team
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LogOut,
  User,
  CreditCard,
  FileText,
  Users,
  Download,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  getCurrentUser,
  logoutAll,
  getParticipantById,
  getDocumentsForParticipant,
} from '@/lib/store'
import type { UserAccount } from '@/lib/types'
import type { Participant, EventDocument } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-green-500' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-500' },
  waitlisted: { label: 'Waitlisted', icon: AlertCircle, color: 'text-orange-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  partial: { label: 'Partial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
}

const DOC_TYPE_ICON: Record<string, React.ElementType> = {
  timetable: Clock,
  material: BookOpen,
  certificate: CheckCircle,
  announcement: AlertCircle,
  other: FileText,
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function AccountDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserAccount | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [documents, setDocuments] = useState<EventDocument[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.replace('/login')
      return
    }
    setUser(currentUser)
    const p = getParticipantById(currentUser.participantId)
    if (p) {
      setParticipant(p)
      setDocuments(getDocumentsForParticipant(p.selectedPackage))
    }
  }, [router])

  const handleLogout = () => {
    logoutAll()
    window.location.href = '/login'
  }

  if (!isMounted) return null

  if (!user || !participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[participant.status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const paymentCfg = PAYMENT_STATUS_CONFIG[participant.paymentStatus] || PAYMENT_STATUS_CONFIG.pending

  const packageLabels: Record<string, string> = {
    'early-bird': 'Early Bird',
    standard: 'Standard',
    vip: 'VIP',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="font-semibold text-foreground">My Account</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-xl border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              Welcome, {participant.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">{participant.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusIcon className={`h-5 w-5 ${statusCfg.color}`} />
            <span className={`font-medium text-sm ${statusCfg.color}`}>{statusCfg.label}</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Registration Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Package</span>
                <Badge variant="outline" className="font-medium">
                  {packageLabels[participant.selectedPackage] || participant.selectedPackage}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receipt #</span>
                <span className="text-sm font-mono font-medium">{participant.receiptNumber || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registration Date</span>
                <span className="text-sm">{formatDate(participant.registrationDate)}</span>
              </div>
              {participant.seatNumbers && participant.seatNumbers.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {participant.seatNumbers.length === 1 ? 'Seat' : 'Seats'}
                  </span>
                  <span className="text-sm font-medium">
                    {participant.seatNumbers.join(', ')}
                  </span>
                </div>
              )}
              {participant.bookingType === 'group' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Booking Type</span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Users className="h-3.5 w-3.5" /> Group
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentCfg.color}`}>
                  {paymentCfg.label}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-sm font-semibold">{formatCurrency(participant.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(participant.amountPaid)}
                </span>
              </div>
              {participant.discountApplied && participant.discountApplied > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Discount Applied</span>
                  <span className="text-sm text-primary font-medium">
                    -{formatCurrency(participant.discountApplied)}
                  </span>
                </div>
              )}
              {participant.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="text-sm capitalize">{participant.paymentMethod.replace(/-/g, ' ')}</span>
                </div>
              )}
              {participant.paymentReference && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">Reference</span>
                  <span className="text-sm font-mono break-all text-right">{participant.paymentReference}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Event Materials &amp; Documents
            </CardTitle>
            <CardDescription>
              Documents shared by the organizer for your registration tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No documents yet</p>
                <p className="text-sm">Materials and timetables will appear here once published.</p>
              </div>
            ) : (
              <div className="divide-y">
                {documents.map((doc) => {
                  const DocIcon = DOC_TYPE_ICON[doc.type] || FileText
                  return (
                    <div key={doc.id} className="flex items-start gap-4 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <DocIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{doc.title}</p>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {doc.type} · {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Open
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Booking Info */}
        {participant.bookingType === 'group' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Group Booking
              </CardTitle>
              <CardDescription>
                You are part of a group registration. Share this login to allow group members to access materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Shared account email</p>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">{participant.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard?.writeText(participant.email)}
                >
                  Copy email
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                All members of this group registration share a single account. Send them the email above and the password you set during registration.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          Signed in as <span className="font-medium">{user.email}</span>
          {user.lastLogin && (
            <> · Last login: {formatDate(user.lastLogin)}</>
          )}
        </div>
      </main>
    </div>
  )
}

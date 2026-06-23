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
  Pencil,
  Save,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  getCurrentUser,
  logoutAll,
  loginUser,
  loadParticipantForDashboard,
  getDocumentsForParticipant,
  updateParticipant,
  getAllPackages,
  resetUserAccountPassword,
} from '@/lib/store'
import type { UserAccount, GroupMember, Package } from '@/lib/types'
import type { Participant, EventDocument } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-green-500' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-500' },
  waitlist: { label: 'Waitlisted', icon: AlertCircle, color: 'text-orange-500' },
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
  const [packages, setPackages] = useState<Package[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [loadError, setLoadError] = useState(false)

  // Group member editing state
  const [editingMembers, setEditingMembers] = useState(false)
  const [memberDraft, setMemberDraft] = useState<GroupMember[]>([])
  const [memberSaved, setMemberSaved] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.replace('/login')
      return
    }
    setUser(currentUser)
    setPackages(getAllPackages())
    // Participants are a heavy key — not in memStore on public pages.
    // Fetch directly from DB so the dashboard works without AdminLayout.
    // loadParticipantForDashboard also populates memStore so updateParticipant() works.
    loadParticipantForDashboard(currentUser.participantId).then(p => {
      if (p) {
        setParticipant(p)
        setDocuments(getDocumentsForParticipant(p.selectedPackage))
      } else {
        // Participant ID in session not found in DB → stale/invalid session
        logoutAll()
        router.replace('/login')
      }
    }).catch(() => {
      setLoadError(true)
    })
  }, [router])

  const handleEditMembers = () => {
    if (!participant) return
    // groupSeats - 1 because the applicant (seat 1) is not in groupMembers
    const memberCount = Math.max(1, (participant.groupSeats ?? 2) - 1)
    const existing = participant.groupMembers ?? []
    const padded = Array.from({ length: memberCount }, (_, i) => existing[i] ?? { name: '', email: '', phone: '' })
    setMemberDraft(padded)
    setEditingMembers(true)
    setMemberSaved(false)
  }

  const handleSaveMembers = () => {
    if (!participant) return
    const updated = updateParticipant(participant.id, {
      groupMembers: memberDraft.filter(m => m.name.trim()),
    })
    if (updated) {
      setParticipant(updated)
      setEditingMembers(false)
      setMemberSaved(true)
      setTimeout(() => setMemberSaved(false), 3000)
    }
  }

  const updateMemberField = (index: number, field: keyof GroupMember, value: string) => {
    setMemberDraft(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const handleLogout = () => {
    logoutAll()
    window.location.href = '/login'
  }

  // Change password state
  const [showChangePw, setShowChangePw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const [pwSaving, setPwSaving] = useState(false)

  const handleChangePassword = async () => {
    setPwError('')
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError('All fields are required.')
      return
    }
    if (!loginUser(user!.email, pwForm.current)) {
      setPwError('Current password is incorrect.')
      return
    }
    if (pwForm.next.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    setPwSaving(true)
    const ok = await resetUserAccountPassword(user!.email, pwForm.next)
    setPwSaving(false)
    if (!ok) {
      setPwError('Failed to save — please check your connection and try again.')
      return
    }
    setPwSuccess(true)
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => { setPwSuccess(false); setShowChangePw(false) }, 2500)
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3 p-8">
          <p className="text-destructive font-medium">Failed to load your account data.</p>
          <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary underline"
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }

  if (!isMounted || !user || !participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[participant.status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const paymentCfg = PAYMENT_STATUS_CONFIG[participant.paymentStatus] || PAYMENT_STATUS_CONFIG.pending

  const packageName = packages.find(p => p.id === participant.selectedPackage)?.name ?? participant.selectedPackage

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
                  {packageName}
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
                  const isLocal = doc.fileUrl.startsWith('data:')
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
                      <div className="flex items-center gap-3 shrink-0">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </a>
                        {isLocal && (
                          <a
                            href={doc.fileUrl}
                            download={doc.fileName || doc.title}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Members */}
        {participant.bookingType === 'group' && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-primary" />
                    Group Members
                    {participant.groupSeats && (
                      <Badge variant="secondary" className="ml-1">{participant.groupSeats} seats</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage the details of everyone in your group booking
                  </CardDescription>
                </div>
                {!editingMembers && (
                  <Button variant="outline" size="sm" onClick={handleEditMembers} className="shrink-0 gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Members
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {memberSaved && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Group members saved successfully.
                </div>
              )}

              {editingMembers ? (
                <div className="space-y-4">
                  {memberDraft.map((member, i) => (
                    <div key={i} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        Additional Member {i + 1}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Full Name <span className="text-destructive">*</span></Label>
                          <Input
                            placeholder="Full name"
                            value={member.name}
                            onChange={(e) => updateMemberField(i, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={member.email}
                            onChange={(e) => updateMemberField(i, 'email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Phone</Label>
                          <Input
                            placeholder="+255 7XX XXX XXX"
                            value={member.phone}
                            onChange={(e) => updateMemberField(i, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-1">
                    <Button onClick={handleSaveMembers} className="gap-1.5">
                      <Save className="h-4 w-4" />
                      Save Members
                    </Button>
                    <Button variant="outline" onClick={() => setEditingMembers(false)} className="gap-1.5">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : participant.groupMembers && participant.groupMembers.length > 0 ? (
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {participant.groupMembers.map((member, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 bg-card">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0 text-sm font-semibold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.name || '—'}</p>
                        <div className="flex flex-wrap gap-x-3 mt-0.5">
                          {member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
                          {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
                        </div>
                      </div>
                      {i === 0 && <Badge variant="outline" className="text-xs shrink-0">Lead</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No member details yet</p>
                  <p className="text-xs mt-1">Click "Edit Members" to add your group members' information.</p>
                </div>
              )}

              <Separator />
              <div className="rounded-lg bg-muted/50 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">Shared login email</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{participant.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigator.clipboard?.writeText(participant.email)}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                All members share this account. Send them the email above and your password to access event materials.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Account Security
            </CardTitle>
            <CardDescription>Update your login password</CardDescription>
          </CardHeader>
          <CardContent>
            {!showChangePw ? (
              <Button variant="outline" size="sm" onClick={() => setShowChangePw(true)} className="gap-2">
                <KeyRound className="h-4 w-4" />
                Change Password
              </Button>
            ) : (
              <div className="space-y-3 max-w-sm">
                {[
                  { key: 'current', label: 'Current Password', placeholder: 'Your current password' },
                  { key: 'next', label: 'New Password', placeholder: 'Min 6 characters' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-sm">{label}</Label>
                    <div className="relative">
                      <Input
                        type={showPw[key as keyof typeof showPw] ? 'text' : 'password'}
                        placeholder={placeholder}
                        value={pwForm[key as keyof typeof pwForm]}
                        onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPw[key as keyof typeof showPw] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                {pwError && <p className="text-sm text-destructive">{pwError}</p>}
                {pwSuccess && <p className="text-sm text-green-600 font-medium">✓ Password updated successfully!</p>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleChangePassword} disabled={pwSaving}>
                    {pwSaving ? 'Saving…' : 'Save Password'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={pwSaving} onClick={() => { setShowChangePw(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }) }}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

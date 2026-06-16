'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, User, Briefcase, CreditCard, FileText, Calendar, MapPin, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createParticipant,
  updateParticipant,
} from '@/lib/store'
import {
  type Participant,
  type PackageType,
  type ParticipantStatus,
  type PaymentStatus,
  type Gender,
  type BookingType,
  type PaymentMethod,
  PACKAGES,
  BUSINESS_TYPES,
  OCCUPATIONS,
  PAYMENT_METHODS_CONFIG,
  TRAINING_INTERESTS,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { InterestSelector } from './interest-selector'

interface ParticipantModalProps {
  participant?: Participant
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  mode: 'view' | 'edit' | 'add'
}

const initialFormData = {
  fullName: '',
  phoneNumber: '',
  whatsappNumber: '',
  email: '',
  gender: '' as Gender | '',
  country: '',
  city: '',
  occupation: '',
  organizationName: '',
  businessType: '',
  yearsOfExperience: '',
  trainingInterests: [] as string[],
  bookingType: 'individual' as BookingType,
  selectedPackage: 'standard' as PackageType,
  paymentStatus: 'unpaid' as PaymentStatus,
  amountPaid: '',
  totalAmount: '',
  paymentMethod: '' as PaymentMethod | '',
  paymentReference: '',
  status: 'pending' as ParticipantStatus,
  notes: '',
}

export function ParticipantModal({
  participant,
  isOpen,
  onClose,
  onSave,
  mode,
}: ParticipantModalProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (participant && (mode === 'view' || mode === 'edit')) {
      setFormData({
        fullName: participant.fullName,
        phoneNumber: participant.phoneNumber,
        whatsappNumber: participant.whatsappNumber,
        email: participant.email,
        gender: participant.gender || '',
        country: participant.country || '',
        city: participant.city,
        occupation: participant.occupation,
        organizationName: participant.organizationName || '',
        businessType: participant.businessType,
        yearsOfExperience: participant.yearsOfExperience?.toString() || '',
        trainingInterests: participant.trainingInterests,
        bookingType: participant.bookingType || 'individual',
        selectedPackage: participant.selectedPackage,
        paymentStatus: participant.paymentStatus,
        amountPaid: participant.amountPaid.toString(),
        totalAmount: participant.totalAmount.toString(),
        paymentMethod: participant.paymentMethod || '',
        paymentReference: participant.paymentReference || '',
        status: participant.status,
        notes: participant.notes || '',
      })
    } else if (mode === 'add') {
      setFormData(initialFormData)
    }
  }, [participant, mode])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (mode === 'add') {
        const pkg = PACKAGES.find(p => p.id === formData.selectedPackage)
        createParticipant({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          whatsappNumber: formData.whatsappNumber,
          email: formData.email,
          gender: formData.gender || undefined,
          country: formData.country || undefined,
          city: formData.city,
          occupation: formData.occupation,
          organizationName: formData.organizationName || undefined,
          businessType: formData.businessType,
          yearsOfExperience: formData.yearsOfExperience
            ? parseInt(formData.yearsOfExperience)
            : undefined,
          trainingInterests: formData.trainingInterests,
          bookingType: formData.bookingType,
          selectedPackage: formData.selectedPackage,
          paymentStatus: formData.paymentStatus,
          amountPaid: parseFloat(formData.amountPaid) || 0,
          totalAmount: parseFloat(formData.totalAmount) || pkg?.price || 0,
          paymentMethod: (formData.paymentMethod as PaymentMethod) || undefined,
          paymentReference: formData.paymentReference || undefined,
          status: formData.status,
          notes: formData.notes || undefined,
        })
      } else if (mode === 'edit' && participant) {
        updateParticipant(participant.id, {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          whatsappNumber: formData.whatsappNumber,
          email: formData.email,
          gender: formData.gender || undefined,
          country: formData.country || undefined,
          city: formData.city,
          occupation: formData.occupation,
          organizationName: formData.organizationName || undefined,
          businessType: formData.businessType,
          yearsOfExperience: formData.yearsOfExperience
            ? parseInt(formData.yearsOfExperience)
            : undefined,
          trainingInterests: formData.trainingInterests,
          bookingType: formData.bookingType,
          selectedPackage: formData.selectedPackage,
          paymentStatus: formData.paymentStatus,
          amountPaid: parseFloat(formData.amountPaid) || 0,
          totalAmount: parseFloat(formData.totalAmount) || participant.totalAmount,
          paymentMethod: (formData.paymentMethod as PaymentMethod) || undefined,
          paymentReference: formData.paymentReference || undefined,
          status: formData.status,
          notes: formData.notes || undefined,
        })
      }
      onSave?.()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApprovePayment = () => {
    if (!participant) return
    updateParticipant(participant.id, {
      paymentStatus: 'paid',
      amountPaid: participant.totalAmount,
      status: 'confirmed',
    })
    onSave?.()
    onClose()
  }

  const selectedPkg = PACKAGES.find((p) => p.id === formData.selectedPackage)

  const statusColors: Record<ParticipantStatus, string> = {
    pending: 'bg-warning/10 text-warning border-warning/30',
    confirmed: 'bg-success/10 text-success border-success/30',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
    waitlist: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  }

  const paymentStatusColors: Record<PaymentStatus, string> = {
    unpaid: 'bg-destructive/10 text-destructive border-destructive/30',
    partial: 'bg-warning/10 text-warning border-warning/30',
    paid: 'bg-success/10 text-success border-success/30',
    refunded: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  }

  if (mode === 'view' && participant) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              {participant.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize',
                  statusColors[participant.status]
                )}
              >
                {participant.status}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize',
                  paymentStatusColors[participant.paymentStatus]
                )}
              >
                {participant.paymentStatus}
              </span>
            </div>

            {/* Personal Info */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-foreground">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {participant.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {participant.phoneNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd className="font-medium text-foreground">{participant.whatsappNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">City</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {participant.country ? `${participant.city}, ${participant.country}` : participant.city}
                  </dd>
                </div>
                {participant.gender && (
                  <div>
                    <dt className="text-muted-foreground">Gender</dt>
                    <dd className="font-medium capitalize text-foreground">{participant.gender}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Professional Info */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                <Briefcase className="h-4 w-4 text-primary" />
                Professional Information
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Occupation</dt>
                  <dd className="font-medium text-foreground">{participant.occupation}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Industry</dt>
                  <dd className="font-medium text-foreground">{participant.businessType}</dd>
                </div>
                {participant.organizationName && (
                  <div>
                    <dt className="text-muted-foreground">Organization</dt>
                    <dd className="font-medium text-foreground">{participant.organizationName}</dd>
                  </div>
                )}
                {participant.yearsOfExperience !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">Experience</dt>
                    <dd className="font-medium text-foreground">
                      {participant.yearsOfExperience} years
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Training Interests */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Training Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {participant.trainingInterests.map((interestId) => {
                  const interest = TRAINING_INTERESTS.find((i) => i.id === interestId)
                  return (
                    <span
                      key={interestId}
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                      {interest?.label || interestId}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Package & Payment */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                Package & Payment
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Selected Package</dt>
                  <dd className="font-medium text-foreground">
                    {PACKAGES.find((p) => p.id === participant.selectedPackage)?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Package Price</dt>
                  <dd className="font-medium text-foreground">
                    TZS{' '}
                    {formatCurrency(
                      PACKAGES.find((p) => p.id === participant.selectedPackage)?.price || 0
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Amount Paid</dt>
                  <dd className="font-medium text-foreground">
                    TZS {formatCurrency(participant.amountPaid)}
                  </dd>
                </div>
                {participant.paymentMethod && (
                  <div>
                    <dt className="text-muted-foreground">Payment Method</dt>
                    <dd className="font-medium text-foreground">{participant.paymentMethod}</dd>
                  </div>
                )}
                {participant.paymentReference && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Payment Reference</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {participant.paymentReference}
                    </dd>
                  </div>
                )}
              </dl>

              {participant.paymentSlipUrl && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-sm text-muted-foreground">Payment Receipt / Screenshot</p>
                  <a href={participant.paymentSlipUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={participant.paymentSlipUrl}
                      alt="Payment receipt"
                      className="max-h-56 w-auto rounded-lg border border-border object-contain"
                    />
                  </a>
                  {participant.paymentStatus !== 'paid' && (
                    <Button size="sm" className="mt-3 gap-2" onClick={handleApprovePayment}>
                      Approve Payment
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Registration Info */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                Registration Details
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Registered On</dt>
                  <dd className="font-medium text-foreground">
                    {format(new Date(participant.registrationDate), 'PPp')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last Updated</dt>
                  <dd className="font-medium text-foreground">
                    {format(new Date(participant.lastUpdated), 'PPp')}
                  </dd>
                </div>
              </dl>
              {participant.notes && (
                <div className="mt-3 rounded-lg bg-secondary/30 p-3">
                  <dt className="mb-1 text-sm text-muted-foreground">Notes</dt>
                  <dd className="text-sm text-foreground">{participant.notes}</dd>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Edit or Add mode
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Participant' : 'Edit Participant'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g. Tanzania"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
                <Select
                  value={formData.occupation}
                  onValueChange={(value) => setFormData({ ...formData, occupation: value })}
                >
                  <SelectTrigger id="occupation">
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map((occ) => (
                      <SelectItem key={occ} value={occ}>
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger id="businessType">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Training Interests</Label>
                <InterestSelector
                  selectedInterests={formData.trainingInterests}
                  onChange={(interests) =>
                    setFormData({ ...formData, trainingInterests: interests })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selectedPackage">Selected Package</Label>
                <Select
                  value={formData.selectedPackage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, selectedPackage: value as PackageType })
                  }
                >
                  <SelectTrigger id="selectedPackage">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGES.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - TZS {formatCurrency(pkg.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Registration Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as ParticipantStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentStatus: value as PaymentStatus })
                  }
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid (TZS)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min="0"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as PaymentMethod })}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS_CONFIG.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="paymentReference">Payment Reference</Label>
                <Input
                  id="paymentReference"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                  placeholder="Transaction ID or reference number"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes about this participant"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : mode === 'add' ? (
              'Add Participant'
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

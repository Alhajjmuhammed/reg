'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  User,
  Users,
  CreditCard,
  FileText,
  Share2,
  Printer,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StepIndicator } from './step-indicator'
import { PackageSelector } from './package-selector'
import { InterestSelector } from './interest-selector'
import { GroupBookingSelector } from './group-booking-selector'
import { PaymentGateway } from './payment-gateway'
import { CouponInput } from './coupon-input'
import { SeatMap } from './seat-map'
import { createParticipant, getSeatConfiguration, useCoupon, createUserAccount, computeGroupPricing, getAllPackages, getSiteSettings } from '@/lib/store'
import {
  type PackageType,
  type Gender,
  type BookingType,
  type PaymentMethod,
  type GroupMember,
  type Package,
  type SiteSettings,
  BUSINESS_TYPES,
  OCCUPATIONS,
} from '@/lib/types'

const STEPS = [
  { id: 1, title: 'Plan & Seats', description: 'Choose your plan' },
  { id: 2, title: 'Personal Info', description: 'Your details' },
  { id: 3, title: 'Professional', description: 'Work info' },
  { id: 4, title: 'Interests', description: 'Training areas' },
  { id: 5, title: 'Payment', description: 'Complete payment' },
]

const COUNTRIES = [
  'Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Ethiopia', 'Ghana', 'Nigeria',
  'South Africa', 'Egypt', 'Morocco', 'Senegal', 'Cameroon', 'Côte d\'Ivoire',
  'Mozambique', 'Zimbabwe', 'Zambia', 'Malawi', 'Botswana', 'Namibia', 'Angola',
  'DR Congo', 'Sudan', 'Somalia', 'Eritrea', 'Djibouti', 'Comoros', 'Madagascar',
  'Mauritius', 'Seychelles', 'Lesotho', 'Eswatini', 'Burundi', 'Central African Republic',
  'Chad', 'Algeria', 'Libya', 'Tunisia', 'Togo', 'Benin', 'Niger', 'Mali',
  'Burkina Faso', 'Guinea', 'Sierra Leone', 'Liberia', 'Gambia', 'Cape Verde',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'India', 'China', 'Japan', 'Brazil', 'Other',
]

const emptyMember = (): GroupMember => ({ name: '', email: '', phone: '' })

interface FormData {
  // Booking Type
  bookingType: BookingType
  groupSeats: number
  groupBasePackage: PackageType
  groupMembers: GroupMember[]
  // Personal
  fullName: string
  phoneNumber: string
  whatsappNumber: string
  email: string
  gender: Gender | ''
  country: string
  city: string
  // Professional
  occupation: string
  organizationName: string
  businessType: string
  yearsOfExperience: string
  // Interests
  trainingInterests: string[]
  // Package
  selectedPackage: PackageType
  selectedSeats: number[]
  // Account
  password: string
  confirmPassword: string
  // Payment
  couponCode: string
  couponDiscount: number
  notes: string
}

const initialFormData: FormData = {
  bookingType: 'individual',
  groupSeats: 2,
  groupBasePackage: 'standard',
  groupMembers: [emptyMember(), emptyMember()],
  fullName: '',
  phoneNumber: '',
  whatsappNumber: '',
  email: '',
  gender: '',
  country: '',
  city: '',
  occupation: '',
  organizationName: '',
  businessType: '',
  yearsOfExperience: '',
  trainingInterests: [],
  selectedPackage: 'standard',
  selectedSeats: [],
  password: '',
  confirmPassword: '',
  couponCode: '',
  couponDiscount: 0,
  notes: '',
}

interface RegistrationResult {
  id: string
  receiptNumber: string
  fullName: string
  email: string
  selectedPackage: PackageType
  totalAmount: number
  paymentReference: string
  pendingApproval?: boolean
}

export function RegistrationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null)
  const [seatConfig, setSeatConfig] = useState({ totalSeats: 100, availableSeats: 100, reservedSeats: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    setIsMounted(true)
    setSeatConfig(getSeatConfiguration())
    const settings = getSiteSettings()
    setSiteSettings(settings)
    const activePackages = getAllPackages().filter(p => p.active)
    setPackages(activePackages)
    // Ensure default package IDs are valid
    if (activePackages.length > 0) {
      setFormData(prev => ({
        ...prev,
        selectedPackage: activePackages.find(p => p.id === prev.selectedPackage) ? prev.selectedPackage : activePackages[0].id,
        groupBasePackage: activePackages.find(p => p.id === prev.groupBasePackage) ? prev.groupBasePackage : activePackages[0].id,
      }))
    }
  }, [])

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => {
        // When groupSeats changes, resize groupMembers to match
        if (field === 'groupSeats') {
          const newCount = value as number
          const current = prev.groupMembers
          const resized =
            newCount > current.length
              ? [...current, ...Array.from({ length: newCount - current.length }, emptyMember)]
              : current.slice(0, newCount)
          return { ...prev, [field]: value, groupMembers: resized }
        }
        return { ...prev, [field]: value }
      })
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors]
  )

  const updateGroupMember = (index: number, field: keyof GroupMember, value: string) => {
    setFormData((prev) => {
      const updated = prev.groupMembers.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
      return { ...prev, groupMembers: updated }
    })
  }

  const calculateTotal = () => {
    if (formData.bookingType === 'group') {
      const pricing = computeGroupPricing(formData.groupSeats, formData.groupBasePackage)
      return Math.max(0, pricing.totalPrice - formData.couponDiscount)
    }
    const pkg = packages.find(p => p.id === formData.selectedPackage)
    return Math.max(0, (pkg?.price || 0) - formData.couponDiscount)
  }

  const getBaseAmount = () => {
    if (formData.bookingType === 'group') {
      const pricing = computeGroupPricing(formData.groupSeats, formData.groupBasePackage)
      return pricing.totalPrice
    }
    const pkg = packages.find(p => p.id === formData.selectedPackage)
    return pkg?.price || 0
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (step === 2) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
      if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = 'WhatsApp number is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = 'Invalid email format'
      if (!formData.country) newErrors.country = 'Country is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (!formData.password || formData.password.length < 6)
        newErrors.password = 'Password must be at least 6 characters'
      if (formData.confirmPassword !== formData.password)
        newErrors.confirmPassword = 'Passwords do not match'
    }

    if (step === 3) {
      if (!formData.occupation) newErrors.occupation = 'Occupation is required'
      if (!formData.businessType) newErrors.businessType = 'Business type is required'
    }

    if (step === 4) {
      if (formData.trainingInterests.length === 0)
        newErrors.trainingInterests = 'Select at least one area of interest'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handlePaymentComplete = (reference: string, method: PaymentMethod, receiptUrl?: string) => {
    const totalAmount = calculateTotal()
    const selectedPkg = formData.bookingType === 'group'
      ? formData.groupBasePackage
      : formData.selectedPackage
    const pendingApproval = method === 'lipa-number'

    // Use coupon if applied
    if (formData.couponCode) {
      useCoupon(formData.couponCode)
    }

    const participant = createParticipant({
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
      groupSeats: formData.bookingType === 'group' ? formData.groupSeats : undefined,
      groupMembers: formData.bookingType === 'group' ? formData.groupMembers.filter(m => m.name.trim()) : undefined,
      selectedPackage: selectedPkg,
      paymentStatus: pendingApproval ? 'unpaid' : 'paid',
      amountPaid: pendingApproval ? 0 : totalAmount,
      totalAmount: totalAmount,
      paymentMethod: method,
      paymentReference: reference,
      paymentSlipUrl: pendingApproval ? receiptUrl : undefined,
      couponCode: formData.couponCode || undefined,
      discountApplied: formData.couponDiscount || undefined,
      status: pendingApproval ? 'pending' : 'confirmed',
      notes: formData.notes || undefined,
      preferredSeats: formData.selectedSeats.length > 0 ? formData.selectedSeats : undefined,
    })

    setRegistrationResult({
      id: participant.id,
      receiptNumber: participant.receiptNumber || `MC${Date.now()}`,
      fullName: participant.fullName,
      email: participant.email,
      selectedPackage: selectedPkg,
      totalAmount,
      paymentReference: reference,
      pendingApproval,
    })

    // Create user account so participant can log in
    if (formData.password) {
      createUserAccount(formData.email, formData.password, participant.id)
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
  }

  const handleNGeniusRedirect = async (method: PaymentMethod) => {
    const totalAmount = calculateTotal()
    const selectedPkg = formData.bookingType === 'group' ? formData.groupBasePackage : formData.selectedPackage

    if (formData.couponCode) useCoupon(formData.couponCode)

    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalAmount,
        password: formData.password,
        participant: {
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
          yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
          trainingInterests: formData.trainingInterests,
          bookingType: formData.bookingType,
          groupSeats: formData.bookingType === 'group' ? formData.groupSeats : undefined,
          groupMembers: formData.bookingType === 'group' ? formData.groupMembers.filter(m => m.name.trim()) : undefined,
          selectedPackage: selectedPkg,
          paymentMethod: method,
          couponCode: formData.couponCode || undefined,
          discountApplied: formData.couponDiscount || undefined,
          notes: formData.notes || undefined,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.paymentUrl) {
      throw new Error(data.error || 'Failed to create payment order. Please try again.')
    }

    window.location.href = data.paymentUrl
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Registration closed screen
  if (isMounted && siteSettings && !siteSettings.registrationOpen) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-10 text-center">
        <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-bold text-foreground">Registration is Currently Closed</h2>
        <p className="text-sm text-muted-foreground">
          {siteSettings.registrationDeadline
            ? `Registration closed on ${new Date(siteSettings.registrationDeadline).toLocaleDateString()}.`
            : 'Registration is not open at this time.'}
          {' '}Please check back soon or contact us for more information.
        </p>
      </div>
    )
  }

  // Success Screen
  if (registrationResult) {
    const pkg = packages.find(p => p.id === registrationResult.selectedPackage)
    const eventName = siteSettings?.eventName || 'Executive Masterclass'
    
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            {registrationResult.pendingApproval ? 'Registration Submitted!' : 'Registration Successful!'}
          </h2>
          <p className="text-muted-foreground">
            {registrationResult.pendingApproval
              ? 'Your receipt has been submitted and is pending payment approval. Your seat will be confirmed once an admin reviews and approves your payment.'
              : 'Your seat has been confirmed. Please save your receipt number below.'}
          </p>
        </div>

        {/* Receipt */}
        <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-6" id="receipt">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">{eventName}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Receipt Number</p>
              <p className="font-mono text-sm font-bold text-primary">{registrationResult.receiptNumber}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Participant</dt>
              <dd className="font-medium text-foreground">{registrationResult.fullName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Package</dt>
              <dd className="font-medium text-foreground">{pkg?.name ?? registrationResult?.selectedPackage}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment Reference</dt>
              <dd className="font-mono text-foreground">{registrationResult.paymentReference}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-medium text-foreground">
                {registrationResult.pendingApproval ? 'Total Amount (Pending Approval)' : 'Total Paid'}
              </dt>
              <dd className="text-xl font-bold text-primary">
                TZS {formatCurrency(registrationResult.totalAmount)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-sm text-foreground">
              Please save this receipt for your records. Present it at the event for check-in.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex-1"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const receiptText = `${eventName} Receipt\n\nReceipt #: ${registrationResult.receiptNumber}\nParticipant: ${registrationResult.fullName}\nPackage: ${pkg?.name ?? registrationResult?.selectedPackage}\nAmount: TZS ${formatCurrency(registrationResult.totalAmount)}\nReference: ${registrationResult.paymentReference}`
              navigator.clipboard.writeText(receiptText)
            }}
            className="flex-1"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => router.push('/account/dashboard')} variant="outline" className="flex-1">
            View My Account
          </Button>
          <Button
            onClick={() => {
              setRegistrationResult(null)
              setCurrentStep(1)
              setFormData(initialFormData)
            }}
            className="flex-1"
          >
            Register Another Participant
          </Button>
        </div>
      </div>
    )
  }

  const selectedPkg = packages.find((p) => p.id === formData.selectedPackage)
  const totalAmount = calculateTotal()

  return (
    <div className="mx-auto max-w-4xl">
      <StepIndicator steps={STEPS} currentStep={currentStep} className="mb-8" />

      <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/10 ring-1 ring-border/50 sm:p-8">
        {/* Step 1: Booking Type + Plan + Seats */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Choose Your Plan & Seats</h2>
              <p className="text-sm text-muted-foreground">
                Select booking type, your training package, and preferred seat
              </p>
            </div>

            <Tabs
              value={formData.bookingType}
              onValueChange={(value) => updateField('bookingType', value as BookingType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" className="gap-2">
                  <User className="h-4 w-4" />
                  Individual
                </TabsTrigger>
                <TabsTrigger value="group" className="gap-2">
                  <Users className="h-4 w-4" />
                  Group Booking
                </TabsTrigger>
              </TabsList>

              {/* Individual */}
              <TabsContent value="individual" className="mt-6 space-y-6">
                <div className="rounded-lg border border-border bg-secondary/30 p-3 flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    {isMounted ? seatConfig.availableSeats : '...'} seats available
                  </span>
                </div>

                <div>
                  <h3 className="mb-3 font-medium text-foreground">Select Your Package</h3>
                  <PackageSelector
                    selectedPackage={formData.selectedPackage}
                    onSelect={(pkg) => {
                      updateField('selectedPackage', pkg)
                      // Clear seats — new package has a different zone
                      updateField('selectedSeats', [])
                    }}
                  />
                </div>

                <div>
                  <h3 className="mb-3 font-medium text-foreground">Choose Your Seat <span className="text-muted-foreground font-normal text-sm">(Optional)</span></h3>
                  <SeatMap
                    selectedSeats={formData.selectedSeats}
                    onSeatSelect={(seats) => updateField('selectedSeats', seats)}
                    maxSeats={1}
                    currentPackage={formData.selectedPackage}
                  />
                </div>
              </TabsContent>

              {/* Group */}
              <TabsContent value="group" className="mt-6 space-y-6">
                <GroupBookingSelector
                  selectedSeats={formData.groupSeats}
                  onSeatsChange={(seats) => updateField('groupSeats', seats)}
                  basePackage={formData.groupBasePackage}
                  onPackageChange={(pkg) => {
                    updateField('groupBasePackage', pkg)
                    updateField('selectedSeats', [])
                  }}
                />

                <div>
                  <h3 className="mb-3 font-medium text-foreground">Choose Seats for Your Group <span className="text-muted-foreground font-normal text-sm">(Optional)</span></h3>
                  <SeatMap
                    selectedSeats={formData.selectedSeats}
                    onSeatSelect={(seats) => updateField('selectedSeats', seats)}
                    maxSeats={formData.groupSeats}
                    currentPackage={formData.groupBasePackage}
                  />
                </div>

                {/* Group Member Details */}
                <div className="rounded-lg border border-border bg-secondary/20 p-5 space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Group Member Details
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter each member's information. You can update this later from your account.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {formData.groupMembers.map((member, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Member {i + 1}
                          {i === 0 && <span className="ml-2 text-xs text-muted-foreground font-normal">(Group lead / contact person)</span>}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Full Name <span className="text-destructive">*</span></Label>
                            <Input
                              placeholder="Full name"
                              value={member.name}
                              onChange={(e) => updateGroupMember(i, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Email</Label>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              value={member.email}
                              onChange={(e) => updateGroupMember(i, 'email', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Phone</Label>
                            <Input
                              placeholder="+255 7XX XXX XXX"
                              value={member.phone}
                              onChange={(e) => updateGroupMember(i, 'phone', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
              <p className="text-sm text-muted-foreground">
                {formData.bookingType === 'group' 
                  ? 'Enter contact person details for this group booking'
                  : 'Please provide your contact details for registration'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="+255 7XX XXX XXX"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">
                  WhatsApp Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="whatsappNumber"
                  placeholder="+255 7XX XXX XXX"
                  value={formData.whatsappNumber}
                  onChange={(e) => updateField('whatsappNumber', e.target.value)}
                  className={errors.whatsappNumber ? 'border-destructive' : ''}
                />
                {errors.whatsappNumber && (
                  <p className="text-sm text-destructive">{errors.whatsappNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender (Optional)</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField('gender', value as Gender)}
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

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => updateField('country', value)}
                >
                  <SelectTrigger id="country" className={errors.country ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="city">
                  City / Region <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>

              {/* Account Password */}
              <div className="space-y-2 sm:col-span-2">
                <div className="border-t pt-4">
                  <h3 className="text-base font-medium text-foreground mb-1">Create Account</h3>
                  <p className="text-sm text-muted-foreground mb-3">Set a password to access your registration dashboard</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Professional Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Professional Information</h2>
              <p className="text-sm text-muted-foreground">
                Tell us about your professional background
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation">
                  Occupation / Profession <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.occupation}
                  onValueChange={(value) => updateField('occupation', value)}
                >
                  <SelectTrigger id="occupation" className={errors.occupation ? 'border-destructive' : ''}>
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
                {errors.occupation && (
                  <p className="text-sm text-destructive">{errors.occupation}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">
                  Business / Industry Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => updateField('businessType', value)}
                >
                  <SelectTrigger id="businessType" className={errors.businessType ? 'border-destructive' : ''}>
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
                {errors.businessType && (
                  <p className="text-sm text-destructive">{errors.businessType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization / Company Name (Optional)</Label>
                <Input
                  id="organizationName"
                  placeholder="Enter organization name"
                  value={formData.organizationName}
                  onChange={(e) => updateField('organizationName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience (Optional)</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="Enter years"
                  value={formData.yearsOfExperience}
                  onChange={(e) => updateField('yearsOfExperience', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Training Interests */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Training Interests</h2>
              <p className="text-sm text-muted-foreground">
                Select the areas you&apos;re most interested in learning
              </p>
            </div>

            <InterestSelector
              selectedInterests={formData.trainingInterests}
              onChange={(interests) => updateField('trainingInterests', interests)}
            />
            {errors.trainingInterests && (
              <p className="text-sm text-destructive">{errors.trainingInterests}</p>
            )}
          </div>
        )}

        {/* Step 5: Payment */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Complete Payment</h2>
              <p className="text-sm text-muted-foreground">
                Choose your preferred payment method to complete registration
              </p>
            </div>

            {/* Order Summary */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <h3 className="mb-3 font-medium text-foreground">Order Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Participant</dt>
                  <dd className="text-foreground">{formData.fullName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Package</dt>
                  <dd className="text-foreground">
                    {formData.bookingType === 'group'
                      ? `Group (${formData.groupSeats} seats) - ${packages.find(p => p.id === formData.groupBasePackage)?.name ?? formData.groupBasePackage}`
                      : selectedPkg?.name}
                  </dd>
                </div>
                {formData.bookingType === 'group' && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Group Discount</dt>
                    <dd className="text-green-500">
                      -{formatCurrency(computeGroupPricing(formData.groupSeats, formData.groupBasePackage).savings)} TZS
                    </dd>
                  </div>
                )}
                {formData.couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Coupon ({formData.couponCode})</dt>
                    <dd className="text-green-500">-{formatCurrency(formData.couponDiscount)} TZS</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="font-medium text-foreground">Total</dt>
                  <dd className="text-xl font-bold text-primary">TZS {formatCurrency(totalAmount)}</dd>
                </div>
              </dl>
            </div>

            {/* Coupon */}
            <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
              <h3 className="font-medium text-foreground">Have a Coupon Code?</h3>
              <CouponInput
                packageType={formData.bookingType === 'group' ? formData.groupBasePackage : formData.selectedPackage}
                totalAmount={getBaseAmount()}
                onApplyCoupon={(code, discount) => {
                  updateField('couponCode', code)
                  updateField('couponDiscount', discount)
                }}
                onRemoveCoupon={() => {
                  updateField('couponCode', '')
                  updateField('couponDiscount', 0)
                }}
                appliedCoupon={formData.couponCode}
                appliedDiscount={formData.couponDiscount}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or questions?"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
              />
            </div>

            <PaymentGateway
              amount={totalAmount}
              onPaymentComplete={handlePaymentComplete}
              onPaymentError={handlePaymentError}
              onNGeniusRedirect={handleNGeniusRedirect}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </div>
            
            <Button type="button" onClick={handleNext}>
              {currentStep === 4 ? 'Proceed to Payment' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Back button on payment step */}
        {currentStep === 5 && !isProcessing && (
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevious}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Interests
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

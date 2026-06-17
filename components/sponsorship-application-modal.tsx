'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Building2, Receipt, CreditCard, CheckCircle2, Printer,
  ArrowRight, ArrowLeft, Loader2, AlertCircle, X, Eye, EyeOff,
  ClipboardList, Upload, ImageIcon,
} from 'lucide-react'
import Image from 'next/image'
import { getPaymentMethods, createSponsorshipApplication, getSiteSettings } from '@/lib/store'
import type { SponsorshipTier, PaymentMethodConfig, SponsorshipApplication, SiteSettings } from '@/lib/types'
import { cn, assetUrl } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
  mpesa:               'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'mpesa-mixx':        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  tigopesa:            'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  airtel:              'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  halopesa:            'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  visa:                'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  mastercard:          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  'bank-transfer':     'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  'corporate-invoice': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
}

// ── Card brand detection ──────────────────────────────────────────────────────
type CardBrand = 'visa' | 'mastercard' | 'amex' | 'other' | null

function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\s/g, '')
  if (!n) return null
  if (/^4/.test(n)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (n.length >= 1) return 'other'
  return null
}

const BRAND_META: Record<string, { label: string; color: string }> = {
  visa:       { label: 'VISA',       color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' },
  mastercard: { label: 'MASTERCARD', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200' },
  amex:       { label: 'AMEX',       color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200' },
  other:      { label: 'CARD',       color: 'bg-muted text-muted-foreground' },
}

function fmtCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-TZ', {
    style: currency === 'TZS' ? 'decimal' : 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount) + (currency === 'TZS' ? ' TZS' : '')
}

function fmtCardNumber(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function fmtExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

// ── Step bar ──────────────────────────────────────────────────────────────────
const STEPS = ['Company', 'Billing', 'Payment', 'Receipt']

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
              i < current  ? 'bg-primary text-primary-foreground shadow-md' :
              i === current? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                             'bg-muted text-muted-foreground'
            )}>
              {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-[10px] font-semibold whitespace-nowrap hidden sm:block',
              i <= current ? 'text-foreground' : 'text-muted-foreground'
            )}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('flex-1 h-0.5 mx-1.5 mb-4 transition-colors', i < current ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 mb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}

// ── Invoice document (Haminass Group format) ─────────────────────────────────
function InvoiceDoc({
  form, tier, invoiceNumber, issuedAt,
}: {
  form: FormData
  tier: SponsorshipTier
  invoiceNumber?: string
  issuedAt?: string
}) {
  const dateStr = (issuedAt ? new Date(issuedAt) : new Date())
    .toLocaleDateString('en-TZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const amountNum = tier.price
  const amountWords = (() => {
    if (amountNum >= 1_000_000) return `${(amountNum / 1_000_000).toFixed(amountNum % 1_000_000 === 0 ? 0 : 1)} Million ${tier.currency} Only`
    if (amountNum >= 1_000) return `${(amountNum / 1_000).toFixed(amountNum % 1_000 === 0 ? 0 : 1)} Thousand ${tier.currency} Only`
    return `${amountNum.toLocaleString()} ${tier.currency} Only`
  })()

  return (
    <div className="bg-white text-gray-900 text-xs print:border-0 print:shadow-none font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header: logo + INVOICE box */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-gray-300">
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/haminass-logo.png" alt="Haminass Group" className="h-16 w-auto object-contain" />
        </div>
        <div className="text-right">
          <div className="inline-block bg-blue-700 text-white font-extrabold text-lg px-6 py-1 mb-2 tracking-widest">
            INVOICE
          </div>
          <table className="text-xs border border-gray-400 border-collapse ml-auto">
            <tbody>
              <tr>
                <td className="border border-gray-400 px-2 py-0.5 font-semibold bg-gray-50">DATE:</td>
                <td className="border border-gray-400 px-2 py-0.5">{dateStr}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-0.5 font-semibold bg-gray-50">Invoice No:</td>
                <td className="border border-gray-400 px-2 py-0.5 font-mono">{invoiceNumber || 'PREVIEW'}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-0.5 font-semibold bg-gray-50">TIN:</td>
                <td className="border border-gray-400 px-2 py-0.5">141 – 008 – 897</td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-0.5 font-semibold bg-gray-50">ZRB:</td>
                <td className="border border-gray-400 px-2 py-0.5">Z025674759</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* To / From */}
      <div className="grid grid-cols-2 gap-6 py-3 border-b border-gray-300">
        <div>
          <p className="font-semibold mb-1">To: ………………………………………</p>
          <p className="font-bold text-sm">{form.billingName || form.companyName}.</p>
          <p>{form.billingAddress}</p>
          {form.contactPhone && <p>Tel: {form.contactPhone}</p>}
          {form.billingCity && <p>{form.billingCity} – {form.billingCountry}.</p>}
          {form.taxId && <p>TIN: {form.taxId}</p>}
        </div>
        <div>
          <p className="font-semibold mb-1">From: ………………………………………</p>
          <p className="font-bold text-sm">HAMINASS GROUP LIMITED.</p>
          <p>Mwanakwerekwe,</p>
          <p>Mzee Kificho Building, Ground Floor,</p>
          <p>Zanzibar – Tanzania.</p>
          <p>Call/WhatsApp +255 763 303 428</p>
          <p>E – Mail: info@haminass.com</p>
          <p>Website: http://www.haminass.com</p>
        </div>
      </div>

      {/* Service table */}
      <div className="py-3">
        <p className="text-center font-bold text-sm border border-gray-400 py-1 mb-0 bg-gray-100 tracking-widest">SERVICE TYPE: INVOICE</p>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 text-center w-8">S/N</th>
              <th className="border border-gray-400 px-2 py-1 text-left w-32">Service Name:</th>
              <th className="border border-gray-400 px-2 py-1 text-left">Service Descriptions</th>
              <th className="border border-gray-400 px-2 py-1 text-center w-16">Qty</th>
              <th className="border border-gray-400 px-2 py-1 text-right w-28">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 px-2 py-3 text-center align-top">1.</td>
              <td className="border border-gray-400 px-2 py-3 align-top font-semibold">{tier.name} Sponsorship</td>
              <td className="border border-gray-400 px-2 py-3 align-top">
                <p>{tier.description}</p>
                <ul className="mt-1 space-y-0.5">
                  {tier.benefits.filter(b => b.included).slice(0, 4).map((b, i) => (
                    <li key={i} className="text-gray-500">✓ {b.text}</li>
                  ))}
                </ul>
              </td>
              <td className="border border-gray-400 px-2 py-3 text-center align-top">1</td>
              <td className="border border-gray-400 px-2 py-3 text-right align-top font-semibold whitespace-nowrap">{fmtCurrency(tier.price, tier.currency)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="border border-gray-400 px-2 py-1" />
              <td className="border border-gray-400 px-2 py-1 text-right font-semibold">Sub Total:</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-bold">{fmtCurrency(tier.price, tier.currency)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-400 px-2 py-0.5" />
              <td className="border border-gray-400 px-2 py-0.5 text-right font-semibold">Inclusive:</td>
              <td className="border border-gray-400 px-2 py-0.5 text-right">–</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-400 px-2 py-1" />
              <td className="border border-gray-400 px-2 py-1 text-right font-bold">Net Total:</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-extrabold">{fmtCurrency(tier.price, tier.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in words */}
      <p className="py-1 text-xs"><span className="font-semibold">Amount in words:</span> {amountWords}</p>

      {/* Payment information */}
      <div className="py-2 border-t border-gray-300 text-xs space-y-0.5">
        <p className="font-semibold">Payment information:</p>
        <p>– We Accept Cash Payment limited to 2,500,000.00 Tzs.</p>
        <p>– Mobile LIPA Number: 440625027</p>
        <p>– Name: Haminass Group LTD, (Please add applicable withdrawal charges):</p>
        <div className="mt-2">
          <p className="font-semibold">Bank Account Details:</p>
          <p>Bank Name: NATIONAL BANK OF COMMERCE (NBC),</p>
          <p>Account name: HAMINASS GROUP LIMITED</p>
          <p className="font-bold">Tzs. A/C No: 089186010433 | Swift code: NLCBTZTXXXX</p>
        </div>
      </div>

      {/* Thank you note */}
      <p className="text-[10px] text-gray-500 text-center italic border-t border-gray-200 pt-2">
        If you have any questions concerning this invoice, please don't hesitate to contact us through Call/WhatsApp Number +255 779 507 985 or Email Us: billings@haminass.com
      </p>
      <p className="text-[10px] text-gray-500 text-center font-semibold">THANK YOU FOR GIVING A CHANCE TO DO A BUSINESS WITH YOU AGAIN!</p>

      {/* Footer */}
      <div className="border-t-2 border-orange-400 mt-2 pt-1 text-[9px] text-gray-400 text-center">
        Address: Mwanakwerekwe – Zanzibar – Tanzania | P.O.BOX: 2704 | Tell: +255 658 338 646 | +255 710 967 616<br />
        Email: info@haminass.com &nbsp; http://www.haminass.com
      </div>
    </div>
  )
}

// ── Form data ─────────────────────────────────────────────────────────────────
interface FormData {
  // Company
  companyName: string; contactName: string; contactEmail: string
  contactPhone: string; website: string; industry: string
  // Billing
  billingName: string; billingEmail: string; billingAddress: string
  billingCity: string; billingCountry: string; taxId: string
  // Payment
  paymentMethod: string; paymentReference: string; notes: string
  // Card (only used when visa/mastercard)
  cardNumber: string; cardExpiry: string; cardCvv: string; cardName: string
  // Lipa Number receipt upload
  receiptDataUrl: string; receiptName: string
}

const EMPTY: FormData = {
  companyName: '', contactName: '', contactEmail: '', contactPhone: '',
  website: '', industry: '',
  billingName: '', billingEmail: '', billingAddress: '',
  billingCity: '', billingCountry: 'Tanzania', taxId: '',
  paymentMethod: '', paymentReference: '', notes: '',
  cardNumber: '', cardExpiry: '', cardCvv: '', cardName: '',
  receiptDataUrl: '', receiptName: '',
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props { tier: SponsorshipTier | null; open: boolean; onClose: () => void }

export function SponsorshipApplicationModal({ tier, open, onClose }: Props) {
  const [step, setStep]           = useState(0)
  const [form, setForm]           = useState<FormData>(EMPTY)
  const [errors, setErrors]       = useState<Partial<Record<keyof FormData, string>>>({})
  const [methods, setMethods]     = useState<PaymentMethodConfig[]>([])
  const [settings, setSettings]   = useState<SiteSettings | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [application, setApp]     = useState<SponsorshipApplication | null>(null)
  const [showCvv, setShowCvv]     = useState(false)
  const scrollRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setStep(0); setForm(EMPTY); setErrors({}); setApp(null)
      setMethods(getPaymentMethods()); setSettings(getSiteSettings())
    }
  }, [open])

  // Scroll to top of content on step change
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  const patch = (p: Partial<FormData>) => setForm(f => ({ ...f, ...p }))
  const isCard = form.paymentMethod === 'visa' || form.paymentMethod === 'mastercard'
  const isLipaNumber = form.paymentMethod === 'lipa-number'
  const selectedMethod = methods.find(m => m.id === form.paymentMethod)
  const detectedBrand = detectCardBrand(form.cardNumber)

  // Auto-switch payment method to match detected card brand
  const handleCardNumberChange = (raw: string) => {
    const formatted = fmtCardNumber(raw)
    const brand = detectCardBrand(formatted)
    const update: Partial<FormData> = { cardNumber: formatted }
    if (brand === 'visa' && form.paymentMethod !== 'visa') update.paymentMethod = 'visa'
    if (brand === 'mastercard' && form.paymentMethod !== 'mastercard') update.paymentMethod = 'mastercard'
    patch(update)
  }

  const handleReceiptChange = (file: File | null) => {
    if (!file) { patch({ receiptDataUrl: '', receiptName: '' }); return }
    const reader = new FileReader()
    reader.onload = () => patch({ receiptDataUrl: reader.result as string, receiptName: file.name })
    reader.readAsDataURL(file)
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (s: number) => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (s === 0) {
      if (!form.companyName.trim()) e.companyName = 'Company name is required'
      if (!form.contactName.trim()) e.contactName = 'Contact name is required'
      if (!form.contactEmail.trim()) e.contactEmail = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Invalid email'
      if (!form.contactPhone.trim()) e.contactPhone = 'Phone number is required'
      if (!form.industry.trim()) e.industry = 'Industry is required'
    }
    if (s === 1) {
      if (!form.billingName.trim()) e.billingName = 'Billing name is required'
      if (!form.billingEmail.trim()) e.billingEmail = 'Billing email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billingEmail)) e.billingEmail = 'Invalid email'
      if (!form.billingAddress.trim()) e.billingAddress = 'Address is required'
      if (!form.billingCity.trim()) e.billingCity = 'City is required'
      if (!form.billingCountry.trim()) e.billingCountry = 'Country is required'
    }
    if (s === 2) {
      if (!form.paymentMethod) e.paymentMethod = 'Select a payment method'
      if (isCard) {
        if (form.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
        if (form.cardExpiry.length < 5) e.cardExpiry = 'Enter expiry as MM/YY'
        if (form.cardCvv.length < 3) e.cardCvv = 'Enter a valid CVV'
        if (!form.cardName.trim()) e.cardName = 'Name on card is required'
      } else if (isLipaNumber) {
        if (!form.receiptDataUrl && !form.paymentReference.trim()) e.paymentReference = 'Please upload your payment receipt/screenshot or enter the payment reference number'
      } else {
        if (!form.paymentReference.trim()) e.paymentReference = 'Payment reference / transaction ID is required'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate(step)) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!tier) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    // For card payments, use last-4 as reference; for Lipa Number, generate a reference
    const ref = isCard
      ? `CARD-${form.cardNumber.replace(/\s/g, '').slice(-4)}-${Date.now().toString(36).toUpperCase()}`
      : isLipaNumber
        ? (form.paymentReference.trim() || `LIPA-${Date.now().toString(36).toUpperCase()}`)
        : form.paymentReference.trim()
    const app = createSponsorshipApplication({
      companyName:    form.companyName.trim(),
      contactName:    form.contactName.trim(),
      contactEmail:   form.contactEmail.trim(),
      contactPhone:   form.contactPhone.trim(),
      website:        form.website.trim() || undefined,
      industry:       form.industry.trim(),
      billingName:    form.billingName.trim(),
      billingEmail:   form.billingEmail.trim(),
      billingAddress: form.billingAddress.trim(),
      billingCity:    form.billingCity.trim(),
      billingCountry: form.billingCountry.trim(),
      taxId:          form.taxId.trim() || undefined,
      tierId:         tier.id,
      tierName:       tier.name,
      amount:         tier.price,
      currency:       tier.currency,
      paymentMethod:  form.paymentMethod as SponsorshipApplication['paymentMethod'],
      paymentReference: ref,
      receiptUrl:     isLipaNumber ? form.receiptDataUrl : undefined,
      notes:          form.notes.trim() || undefined,
    })
    setApp(app)
    setSubmitting(false)
    setStep(3)
  }

  if (!open || !tier) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="no-print flex items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 sm:px-8 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {step < 3 ? `${tier.name} Sponsorship Application` : 'Application Confirmed'}
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">{fmtCurrency(tier.price, tier.currency)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Step bar ─────────────────────────────────────────────────────── */}
      {step < 3 && (
        <div className="no-print border-b border-border bg-background/90 px-4 sm:px-8 py-4 shrink-0">
          <StepBar current={step} />
        </div>
      )}

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-8 py-8">

          {/* ── Step 0: Company ───────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <SectionHead icon={Building2} title="Company & Contact Information" sub="Tell us about your organisation and who we should contact" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company / Organisation Name" required error={errors.companyName}>
                  <Input value={form.companyName} onChange={e => patch({ companyName: e.target.value })} placeholder="Acme Tanzania Ltd" />
                </Field>
                <Field label="Industry / Sector" required error={errors.industry}>
                  <Input value={form.industry} onChange={e => patch({ industry: e.target.value })} placeholder="e.g. Technology, Finance, Retail" />
                </Field>
                <Field label="Contact Person Name" required error={errors.contactName}>
                  <Input value={form.contactName} onChange={e => patch({ contactName: e.target.value })} placeholder="John Doe" />
                </Field>
                <Field label="Contact Phone" required error={errors.contactPhone}>
                  <Input value={form.contactPhone} onChange={e => patch({ contactPhone: e.target.value })} placeholder="+255 712 345 678" type="tel" />
                </Field>
                <Field label="Contact Email" required error={errors.contactEmail}>
                  <Input value={form.contactEmail} onChange={e => patch({ contactEmail: e.target.value })} placeholder="john@company.com" type="email" />
                </Field>
                <Field label="Company Website (optional)">
                  <Input value={form.website} onChange={e => patch({ website: e.target.value })} placeholder="https://company.com" type="url" />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 1: Billing ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <SectionHead icon={Receipt} title="Billing Information" sub="This information will appear on your invoice" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Billing Name / Company" required error={errors.billingName}>
                  <Input value={form.billingName} onChange={e => patch({ billingName: e.target.value })} placeholder="Acme Tanzania Ltd" />
                </Field>
                <Field label="Billing Email" required error={errors.billingEmail}>
                  <Input value={form.billingEmail} onChange={e => patch({ billingEmail: e.target.value })} placeholder="accounts@company.com" type="email" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Billing Address" required error={errors.billingAddress}>
                    <Input value={form.billingAddress} onChange={e => patch({ billingAddress: e.target.value })} placeholder="P.O. Box 1234 or full street address" />
                  </Field>
                </div>
                <Field label="City" required error={errors.billingCity}>
                  <Input value={form.billingCity} onChange={e => patch({ billingCity: e.target.value })} placeholder="Dar es Salaam" />
                </Field>
                <Field label="Country" required error={errors.billingCountry}>
                  <Input value={form.billingCountry} onChange={e => patch({ billingCountry: e.target.value })} placeholder="Tanzania" />
                </Field>
                <Field label="Tax ID / TIN (optional)">
                  <Input value={form.taxId} onChange={e => patch({ taxId: e.target.value })} placeholder="123-456-789" />
                </Field>
                <Field label="Additional Notes (optional)">
                  <Textarea value={form.notes} onChange={e => patch({ notes: e.target.value })} placeholder="Any special requirements or questions?" rows={2} />
                </Field>
              </div>

              {/* Invoice preview */}
              {(form.billingName || form.companyName) && (
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Invoice Preview</p>
                  <div className="rounded-xl border border-border p-4 bg-white">
                    <InvoiceDoc form={form} tier={tier} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Payment ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionHead icon={CreditCard} title="Payment Method" sub="Choose how you'd like to pay for this sponsorship" />

              {/* Amount pill */}
              <div className="rounded-xl border bg-secondary/30 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sponsorship Package</p>
                  <p className="font-bold text-foreground">{tier.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-extrabold text-primary">{fmtCurrency(tier.price, tier.currency)}</p>
                </div>
              </div>

              {/* Method grid — M-Pesa · Mixx by Yas · Lipa Number · Card */}
              {errors.paymentMethod && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />{errors.paymentMethod}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* M-Pesa */}
                <button
                  type="button"
                  onClick={() => patch({ paymentMethod: 'mpesa' })}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                    form.paymentMethod === 'mpesa'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <Image src={assetUrl('/images/mpesa-logo.png')} alt="M-Pesa" width={72} height={28} className="h-7 w-auto object-contain" />
                  <p className="text-xs font-semibold text-foreground">M-PESA</p>
                  <p className="text-[10px] text-muted-foreground">Paybill: 888880</p>
                  {form.paymentMethod === 'mpesa' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                {/* Mixx by Yas */}
                <button
                  type="button"
                  onClick={() => patch({ paymentMethod: 'mpesa-mixx' })}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                    form.paymentMethod === 'mpesa-mixx'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <Image src={assetUrl('/images/mixx-by-yas-logo.png')} alt="Mixx by Yas" width={72} height={28} className="h-7 w-auto object-contain" />
                  <p className="text-xs font-semibold text-foreground">MIXX BY YAS</p>
                  <p className="text-[10px] text-muted-foreground">Paybill: 888880</p>
                  {form.paymentMethod === 'mpesa-mixx' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                {/* Lipa Number — upload receipt for admin approval */}
                <button
                  type="button"
                  onClick={() => patch({ paymentMethod: 'lipa-number' })}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                    form.paymentMethod === 'lipa-number'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <Image src={assetUrl('/images/lipa-number-logo.jpg')} alt="Lipa Number" width={72} height={28} className="h-7 w-auto object-contain rounded" />
                  <p className="text-xs font-semibold text-foreground">LIPA NUMBER</p>
                  <p className="text-[10px] text-muted-foreground">Upload receipt for approval</p>
                  {form.paymentMethod === 'lipa-number' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                {/* Card — Visa / Mastercard auto-detected from number */}
                <button
                  type="button"
                  onClick={() => { if (!isCard) patch({ paymentMethod: 'visa' }) }}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                    isCard
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                    Card
                  </span>
                  <p className="text-xs font-semibold text-foreground">Visa / Mastercard</p>
                  <p className="text-[10px] text-muted-foreground">Auto-detect from number</p>
                  {isCard && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              </div>

              {/* Instructions for mobile money (not Lipa Number, not card) */}
              {selectedMethod && !isCard && !isLipaNumber && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">Payment Instructions</p>
                  <p className="text-sm text-foreground">{selectedMethod.instructions}</p>
                  {selectedMethod.accountInfo && (
                    <code className="block text-xs bg-background rounded px-3 py-2 border">{selectedMethod.accountInfo}</code>
                  )}
                  <div className="pt-1">
                    <Field label="Transaction Reference / Payment ID" required error={errors.paymentReference}>
                      <Input
                        value={form.paymentReference}
                        onChange={e => patch({ paymentReference: e.target.value })}
                        placeholder="e.g. MP123456789"
                        className="font-mono"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* Lipa Number — receipt / screenshot upload */}
              {isLipaNumber && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">Payment Instructions</p>
                  <p className="text-sm text-foreground">
                    Open your M-Pesa, Mixx by Yas, or banking app, then scan the QR code below or
                    use <strong>Lipa Number: 440625027</strong> (<strong>HAMINASS GROUP LTD</strong>)
                    to complete the payment.
                  </p>
                  <Image
                    src={assetUrl('/images/lipa-number-logo.jpg')}
                    alt="Scan to pay via Lipa Number — 440625027 HAMINASS GROUP LTD"
                    width={220}
                    height={340}
                    className="h-auto w-64 mx-auto rounded-lg border border-border"
                  />
                  <p className="text-sm text-foreground">
                    After paying, upload your receipt/screenshot or enter the payment reference
                    number below. Your application will be confirmed once an admin reviews and
                    approves the payment.
                  </p>
                  {errors.paymentReference && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />{errors.paymentReference}
                    </p>
                  )}

                  <Field label="Payment Reference Number">
                    <Input
                      value={form.paymentReference}
                      onChange={e => patch({ paymentReference: e.target.value })}
                      placeholder="e.g. MP123456789"
                      className="font-mono bg-background"
                    />
                  </Field>

                  <div className="relative py-1 text-center text-xs text-muted-foreground">
                    <span className="bg-primary/5 px-2">— or —</span>
                  </div>

                  <label
                    htmlFor="sponsorReceiptUpload"
                    className={cn(
                      'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors bg-background',
                      form.receiptDataUrl ? 'border-primary/40' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                  >
                    {form.receiptDataUrl ? (
                      <>
                        <ImageIcon className="h-6 w-6 text-primary" />
                        <p className="text-sm font-medium text-foreground">{form.receiptName}</p>
                        <p className="text-xs text-muted-foreground">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">Click to upload receipt</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </>
                    )}
                    <input
                      id="sponsorReceiptUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleReceiptChange(e.target.files?.[0] || null)}
                    />
                  </label>
                  {form.receiptDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.receiptDataUrl} alt="Receipt preview" className="max-h-48 w-auto rounded-lg border border-border object-contain" />
                  )}
                </div>
              )}

              {/* Card fields */}
              {isCard && (
                <div className="rounded-xl border-2 border-primary/20 bg-card p-5 space-y-4">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Card Details
                    {detectedBrand && BRAND_META[detectedBrand] && (
                      <span className={cn('rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wider', BRAND_META[detectedBrand].color)}>
                        {BRAND_META[detectedBrand].label} detected
                      </span>
                    )}
                  </p>
                  <Field label="Name on Card" required error={errors.cardName}>
                    <Input
                      value={form.cardName}
                      onChange={e => patch({ cardName: e.target.value.toUpperCase() })}
                      placeholder="JOHN DOE"
                      className="uppercase font-medium tracking-wider"
                    />
                  </Field>
                  <Field label="Card Number" required error={errors.cardNumber}>
                    <div className="relative">
                      <Input
                        value={form.cardNumber}
                        onChange={e => handleCardNumberChange(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="font-mono text-base tracking-widest pr-24"
                        inputMode="numeric"
                      />
                      {detectedBrand && BRAND_META[detectedBrand] && (
                        <span className={cn(
                          'absolute right-2.5 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wider transition-all',
                          BRAND_META[detectedBrand].color
                        )}>
                          {BRAND_META[detectedBrand].label}
                        </span>
                      )}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry Date" required error={errors.cardExpiry}>
                      <Input
                        value={form.cardExpiry}
                        onChange={e => patch({ cardExpiry: fmtExpiry(e.target.value) })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="font-mono tracking-widest"
                        inputMode="numeric"
                      />
                    </Field>
                    <Field label="CVV" required error={errors.cardCvv}>
                      <div className="relative">
                        <Input
                          value={form.cardCvv}
                          onChange={e => patch({ cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          placeholder="•••"
                          type={showCvv ? 'text' : 'password'}
                          maxLength={4}
                          className="font-mono pr-9"
                          inputMode="numeric"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCvv(v => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCvv ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </Field>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    🔒 Your card details are processed securely and never stored.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2 continued: Review summary (shown below payment form) ── */}
          {step === 2 && (form.companyName || form.billingName) && (
            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Review Your Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</p>
                  {([['Company', form.companyName], ['Contact', form.contactName], ['Email', form.contactEmail], ['Phone', form.contactPhone]] as [string,string][]).map(([k,v]) => v ? (
                    <div key={k}><p className="text-[10px] text-muted-foreground">{k}</p><p className="text-sm font-medium text-foreground break-words">{v}</p></div>
                  ) : null)}
                </div>
                <div className="rounded-xl border bg-card p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing</p>
                  {([['Name', form.billingName], ['Email', form.billingEmail], ['Address', form.billingAddress], ['City', form.billingCity]] as [string,string][]).map(([k,v]) => v ? (
                    <div key={k}><p className="text-[10px] text-muted-foreground">{k}</p><p className="text-sm font-medium text-foreground break-words">{v}</p></div>
                  ) : null)}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
                <p className="font-bold text-foreground">{tier.name} Sponsorship Package</p>
                <p className="text-xl font-extrabold text-primary">{fmtCurrency(tier.price, tier.currency)}</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Receipt ───────────────────────────────────────────── */}
          {step === 3 && application && (
            <div className="space-y-5">
              <div className="no-print rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-5 flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-800 dark:text-green-300">Application Submitted Successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Our sponsorship team will review your application and contact you within 1–2 business days to confirm.
                  </p>
                </div>
              </div>

              {/* Payment Receipt */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Payment Receipt</p>
                    <p className="text-2xl font-extrabold text-foreground font-mono">{application.invoiceNumber}</p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/haminass-logo.png" alt="Haminass Group" className="h-12 w-auto object-contain" />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(application.submittedAt).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold text-amber-600">Pending Confirmation</p></div>
                  <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium">{application.companyName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Contact</p><p className="font-medium">{application.contactName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Package</p><p className="font-medium">{application.tierName} Sponsorship</p></div>
                  <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="font-medium capitalize">{methods.find(m => m.id === application.paymentMethod)?.name || application.paymentMethod}</p></div>
                  {application.paymentReference && (
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">Payment Reference</p><p className="font-mono font-medium">{application.paymentReference}</p></div>
                  )}
                  <div className="col-span-2 border-t pt-3 flex items-center justify-between">
                    <p className="font-bold text-foreground text-base">Total Amount</p>
                    <p className="text-2xl font-extrabold text-primary">{fmtCurrency(application.amount, application.currency)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  Keep this receipt for your records. Your invoice is available from the billing information you provided.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom navigation bar ─────────────────────────────────────────── */}
      <div className="no-print shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          {/* Left: Back or Close */}
          {step === 0 && (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
          {step > 0 && step < 3 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
          )}
          {step === 3 && (
            <Button variant="outline" onClick={onClose}>Close</Button>
          )}

          {/* Right: Next / Submit / Print */}
          <div className="flex items-center gap-2">
            {step < 2 && (
              <Button onClick={handleNext} size="lg" className="gap-2 px-8">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gap-2 px-8">
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  : <><CheckCircle2 className="h-4 w-4" /> Confirm & Submit</>
                }
              </Button>
            )}
            {step === 3 && (
              <Button onClick={() => window.print()} size="lg" className="gap-2">
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body > *:not(#__next) { display: none !important; }
        }
      `}</style>
    </div>
  )
}

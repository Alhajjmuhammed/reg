'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Building2, Receipt, CreditCard, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2, AlertCircle, X, Eye, EyeOff,
  Upload, ImageIcon, Download,
} from 'lucide-react'
import Image from 'next/image'
import { getPaymentMethods, createSponsorshipApplication, getSiteSettings } from '@/lib/store'
import type { SponsorshipTier, PaymentMethodConfig, SponsorshipApplication, SiteSettings } from '@/lib/types'
import { cn, assetUrl } from '@/lib/utils'

// ── Industry options ──────────────────────────────────────────────────────────
const INDUSTRY_OPTIONS = [
  'Technology / ICT',
  'Finance & Banking',
  'Retail & Commerce',
  'Manufacturing',
  'Healthcare & Pharmaceuticals',
  'Education & Training',
  'Agriculture & Livestock',
  'Construction & Real Estate',
  'Transportation & Logistics',
  'Hospitality & Tourism',
  'Media & Communications',
  'Government & Public Sector',
  'NGO / Non-Profit',
  'Oil & Gas / Energy',
  'Telecommunications',
  'Food & Beverage',
  'Mining',
  'Legal & Consulting',
  'Other',
]

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Amount in words helper ────────────────────────────────────────────────────
function toWords(amount: number, currency: string): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)} Million ${currency} Only`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)} Thousand ${currency} Only`
  return `${amount.toLocaleString()} ${currency} Only`
}

// ── Invoice document ──────────────────────────────────────────────────────────
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

  const subTotal  = tier.price
  const vatAmount = Math.round(subTotal * 0.15)
  const netTotal  = subTotal + vatAmount
  const amountWords = toWords(netTotal, tier.currency)

  return (
    <div className="bg-white text-gray-900 text-xs print:border-0 print:shadow-none font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Header: Row 1 — logos; Row 2 — INVOICE + date table */}
      <div className="pb-3 border-b-2 border-gray-300 space-y-3">
        {/* Row 1: Both logos */}
        <div className="flex items-center justify-between">
          {/* Left — Haminass logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/haminass-logo.png" alt="Haminass Group" className="h-16 w-auto object-contain" />
          {/* Right — eOpsprimax logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/eopsprimax-logo.png" alt="eOpsprimax" className="h-10 w-auto object-contain" />
        </div>
        {/* Row 2: INVOICE label + meta table (right-aligned) */}
        <div className="flex justify-end">
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
                  <td className="border border-gray-400 px-2 py-0.5 font-semibold bg-gray-50">ZRA:</td>
                  <td className="border border-gray-400 px-2 py-0.5">Z025674759</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* To / From */}
      <div className="grid grid-cols-2 gap-6 py-3 border-b border-gray-300">
        {/* To: — sponsor details */}
        <div>
          <p className="font-semibold mb-1">To: ………………………………………</p>
          {/* Contact person name first */}
          {form.contactName && <p className="font-bold text-sm">{form.contactName}.</p>}
          {/* Company name below the contact name */}
          {form.companyName && (
            <p className="font-semibold">{form.companyName}.</p>
          )}
          {form.location && <p>{form.location},</p>}
          {form.billingAddress && <p>{form.billingAddress}</p>}
          {form.contactPhone && <p>Tel: {form.contactPhone}</p>}
          {form.poBox && <p>P.O.BOX {form.poBox}</p>}
          {form.billingCity && <p>{form.billingCity} – {form.billingCountry}.</p>}
          {form.taxId && <p>TIN: {form.taxId}</p>}
        </div>
        {/* From: — Haminass */}
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
        <p className="text-center font-bold text-sm border border-gray-400 py-1 mb-0 bg-gray-100 tracking-widest">
          SERVICE TYPE: INVOICE
        </p>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 text-center w-8">S/N</th>
              <th className="border border-gray-400 px-2 py-1 text-left w-32">Service Name:</th>
              <th className="border border-gray-400 px-2 py-1 text-left">Service Descriptions</th>
              <th className="border border-gray-400 px-2 py-1 text-center w-12">Qty</th>
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
              <td className="border border-gray-400 px-2 py-3 text-right align-top font-semibold whitespace-nowrap">
                {fmtCurrency(subTotal, tier.currency)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="border border-gray-400 px-2 py-1" />
              <td className="border border-gray-400 px-2 py-1 text-right font-semibold bg-gray-50">Sub Total:</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-bold">
                {fmtCurrency(subTotal, tier.currency)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-400 px-2 py-0.5" />
              <td className="border border-gray-400 px-2 py-0.5 text-right font-semibold bg-gray-50">VAT (15%):</td>
              <td className="border border-gray-400 px-2 py-0.5 text-right">
                {fmtCurrency(vatAmount, tier.currency)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-400 px-2 py-1" />
              <td className="border border-gray-400 px-2 py-1 text-right font-bold bg-gray-100">Net Total:</td>
              <td className="border border-gray-400 px-2 py-1 text-right font-extrabold">
                {fmtCurrency(netTotal, tier.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in words */}
      <p className="py-1 text-xs">
        <span className="font-semibold">Amount in words:</span> {amountWords}
      </p>

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
        If you have any questions concerning this invoice, please don't hesitate to contact us through
        Call/WhatsApp Number +255 779 507 985 or Email Us: billings@haminass.com
      </p>
      <p className="text-[10px] text-gray-500 text-center font-semibold">
        THANK YOU FOR GIVING A CHANCE TO DO A BUSINESS WITH YOU AGAIN!
      </p>

      {/* Footer — blue text */}
      <div className="border-t-2 border-orange-400 mt-2 pt-1 text-[9px] text-blue-600 text-center">
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
  location: string; poBox: string
  billingCity: string; billingCountry: string; taxId: string
  // Payment
  paymentMethod: string; paymentReference: string; notes: string
  // Card
  cardNumber: string; cardExpiry: string; cardCvv: string; cardName: string
  // Lipa Number receipt upload
  receiptDataUrl: string; receiptName: string
}

const EMPTY: FormData = {
  companyName: '', contactName: '', contactEmail: '', contactPhone: '',
  website: '', industry: '',
  billingName: '', billingEmail: '', billingAddress: '',
  location: '', poBox: '',
  billingCity: '', billingCountry: 'Tanzania', taxId: '',
  paymentMethod: 'lipa-number', paymentReference: '', notes: '',
  cardNumber: '', cardExpiry: '', cardCvv: '', cardName: '',
  receiptDataUrl: '', receiptName: '',
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface Props { tier: SponsorshipTier | null; open: boolean; onClose: () => void }

export function SponsorshipApplicationModal({ tier, open, onClose }: Props) {
  const [step, setStep]             = useState(0)
  const [form, setForm]             = useState<FormData>(EMPTY)
  const [errors, setErrors]         = useState<Partial<Record<keyof FormData, string>>>({})
  const [methods, setMethods]       = useState<PaymentMethodConfig[]>([])
  const [settings, setSettings]     = useState<SiteSettings | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [application, setApp]       = useState<SponsorshipApplication | null>(null)
  const [showCvv, setShowCvv]       = useState(false)
  const [docTab, setDocTab]         = useState<'receipt' | 'invoice'>('receipt')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  // 3DS method (device fingerprinting) state
  const [method, setMethod] = useState<{
    threeDSMethodURL: string; threeDSServerTransID: string; methodNotifyUrl: string
    orderRef: string; paymentId: string; applicationId: string
    invoiceNumber: string; browserInfo: Record<string, unknown>
  } | null>(null)
  // 3DS challenge state
  const [challenge, setChallenge]   = useState<{
    orderRef: string; paymentId: string; applicationId: string
    invoiceNumber: string; acsUrl: string; creq: string; notifyUrl: string
  } | null>(null)
  const scrollRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setStep(0); setForm(EMPTY); setErrors({}); setApp(null); setDocTab('receipt')
      setChallenge(null); setMethod(null)
      setMethods(getPaymentMethods()); setSettings(getSiteSettings())
    }
  }, [open])

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  const patch = (p: Partial<FormData>) => setForm(f => ({ ...f, ...p }))
  const isCard       = form.paymentMethod === 'visa' || form.paymentMethod === 'mastercard'

  // Fetch latest application from Supabase so step 3 shows confirmed status
  const fetchApplication = async (id: string): Promise<SponsorshipApplication | null> => {
    try {
      const res = await fetch(`/api/sponsorship/application?id=${encodeURIComponent(id)}`)
      if (!res.ok) return null
      const data = await res.json()
      return data.application ?? null
    } catch { return null }
  }
  const isLipaNumber   = form.paymentMethod === 'lipa-number'
  const isBankTransfer = form.paymentMethod === 'bank-transfer'
  const selectedMethod = methods.find(m => m.id === form.paymentMethod)
  const detectedBrand  = detectCardBrand(form.cardNumber)

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
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, paymentReference: 'Image is too large. Please upload a file under 5 MB.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => patch({ receiptDataUrl: reader.result as string, receiptName: file.name })
    reader.readAsDataURL(file)
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (s: number) => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (s === 0) {
      if (!form.companyName.trim())  e.companyName  = 'Company name is required'
      if (!form.contactName.trim())  e.contactName  = 'Contact name is required'
      if (!form.contactEmail.trim()) e.contactEmail = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Invalid email'
      if (!form.contactPhone.trim()) e.contactPhone = 'Phone number is required'
      if (!form.industry.trim())     e.industry     = 'Industry / Sector is required'
    }
    if (s === 1) {
      if (!form.billingName.trim())    e.billingName    = 'Billing name is required'
      if (!form.billingEmail.trim())   e.billingEmail   = 'Billing email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billingEmail)) e.billingEmail = 'Invalid email'
      if (!form.billingAddress.trim()) e.billingAddress = 'Address is required'
      if (!form.billingCity.trim())    e.billingCity    = 'City is required'
      if (!form.billingCountry.trim()) e.billingCountry = 'Country is required'
      if (!form.taxId.trim())          e.taxId          = 'Tax ID / TIN is required'
    }
    if (s === 2) {
      if (!form.paymentMethod) e.paymentMethod = 'Select a payment method'
      if (isCard) {
        if (form.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
        if (form.cardExpiry.length < 5)  e.cardExpiry = 'Enter expiry as MM/YY'
        if (form.cardCvv.length < 3)     e.cardCvv    = 'Enter a valid CVV'
        if (!form.cardName.trim())        e.cardName   = 'Name on card is required'
      } else if (isLipaNumber || isBankTransfer) {
        if (!form.receiptDataUrl && !form.paymentReference.trim())
          e.paymentReference = 'Please upload your deposit receipt or enter the reference number'
      } else if (form.paymentMethod) {
        if (!form.paymentReference.trim()) e.paymentReference = 'Phone number is required'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const [downloading, setDownloading] = useState(false)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)

  // Renders HTML off-screen, captures with html2canvas, adds to jsPDF.
  // Returns the pdf instance (does NOT call pdf.save — caller decides).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capturePageIntoPDF = useCallback(async (html2canvas: any, jsPDFClass: any, html: string, pdf?: any) => {
    const wrap = document.createElement('div')
    wrap.setAttribute('style', [
      'position:fixed', 'top:-9999px', 'left:-9999px',
      'width:794px', 'background:#ffffff',
      'font-family:Arial,Helvetica,sans-serif',
      'color:#111111', 'font-size:12px', 'line-height:1.5',
    ].join(';'))
    wrap.innerHTML = html
    document.body.appendChild(wrap)
    try {
      const canvas = await html2canvas(wrap, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onclone: (clonedDoc: any) => {
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((el: Element) => el.remove())
        },
      })
      const isFirst = !pdf
      const doc = pdf ?? new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const imgH  = (canvas.height / canvas.width) * pageW
      if (!isFirst) doc.addPage()
      if (imgH <= pageH) {
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, imgH)
      } else {
        const chunkH = Math.floor(canvas.width * (pageH / pageW))
        let y = 0; let firstChunk = isFirst
        while (y < canvas.height) {
          if (!firstChunk) doc.addPage()
          const sh = Math.min(chunkH, canvas.height - y)
          const sc = document.createElement('canvas'); sc.width = canvas.width; sc.height = sh
          sc.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, sh, 0, 0, canvas.width, sh)
          doc.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, (sh / canvas.width) * pageW)
          y += chunkH; firstChunk = false
        }
      }
      return doc
    } finally {
      document.body.removeChild(wrap)
    }
  }, [])

  // Renders one or two HTML pages into a single PDF and saves it.
  const captureHtmlAsPDF = useCallback(async (html: string, filename: string, termsHtml?: string) => {
    const html2canvas = (await import('html2canvas')).default
    const jsPDF       = (await import('jspdf')).default
    const pdf = await capturePageIntoPDF(html2canvas, jsPDF, html, null)
    if (termsHtml) {
      await capturePageIntoPDF(html2canvas, jsPDF, termsHtml, pdf)
    }
    pdf.save(filename)
  }, [capturePageIntoPDF])

  const buildInvoiceHTML = useCallback(() => {
    if (!tier) return ''
    const origin  = window.location.origin
    const dateStr = new Date().toLocaleDateString('en-TZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const invNo   = application?.invoiceNumber || 'PREVIEW'
    const issuedStr = application?.submittedAt
      ? new Date(application.submittedAt).toLocaleDateString('en-TZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : dateStr
    const sub  = tier.price
    const vat  = Math.round(sub * 0.15)
    const net  = sub + vat
    const fmt  = (n: number) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n) + ' TZS'
    const words = net >= 1_000_000
      ? `${(net / 1_000_000).toFixed(net % 1_000_000 === 0 ? 0 : 1)} Million TZS Only`
      : net >= 1_000
        ? `${(net / 1_000).toFixed(net % 1_000 === 0 ? 0 : 1)} Thousand TZS Only`
        : `${net.toLocaleString()} TZS Only`
    const benefits = tier.benefits.filter(b => b.included).slice(0, 4).map(b => `<li style="color:#6b7280;margin:2px 0">✓ ${b.text}</li>`).join('')
    const toName    = form.contactName   ? `<p style="font-weight:700;font-size:13px;margin:0 0 2px">${form.contactName}.</p>` : ''
    const toCompany = form.companyName   ? `<p style="font-weight:600;margin:0 0 2px">${form.companyName}.</p>` : ''
    const toLoc     = form.location      ? `<p style="margin:0 0 2px">${form.location},</p>` : ''
    const toAddr    = form.billingAddress? `<p style="margin:0 0 2px">${form.billingAddress}</p>` : ''
    const toPhone   = form.contactPhone  ? `<p style="margin:0 0 2px">Tel: ${form.contactPhone}</p>` : ''
    const toPoBox   = form.poBox         ? `<p style="margin:0 0 2px">P.O.BOX ${form.poBox}</p>` : ''
    const toCity    = form.billingCity   ? `<p style="margin:0 0 2px">${form.billingCity} – ${form.billingCountry}.</p>` : ''
    const toTin     = form.taxId         ? `<p style="margin:0 0 2px">TIN: ${form.taxId}</p>` : ''
    return `
<div style="padding:24px;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;line-height:1.5">
  <!-- Row 1: Both logos -->
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #d1d5db;padding-bottom:12px;margin-bottom:10px">
    <img src="${origin}/images/haminass-logo.png" style="height:60px;width:auto;object-fit:contain" crossorigin="anonymous"/>
    <img src="${origin}/images/eopsprimax-logo.png" style="height:40px;width:auto;object-fit:contain" crossorigin="anonymous"/>
  </div>
  <!-- Row 2: INVOICE label + date table -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
    <div style="text-align:right">
      <div style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:900;font-size:18px;padding:4px 24px;margin-bottom:8px;letter-spacing:0.1em">INVOICE</div><br/>
      <table style="border-collapse:collapse;font-size:11px;margin-left:auto">
        <tr><td style="border:1px solid #9ca3af;padding:2px 8px;font-weight:600;background:#f9fafb">DATE:</td><td style="border:1px solid #9ca3af;padding:2px 8px">${issuedStr}</td></tr>
        <tr><td style="border:1px solid #9ca3af;padding:2px 8px;font-weight:600;background:#f9fafb">Invoice No:</td><td style="border:1px solid #9ca3af;padding:2px 8px;font-family:monospace">${invNo}</td></tr>
        <tr><td style="border:1px solid #9ca3af;padding:2px 8px;font-weight:600;background:#f9fafb">TIN:</td><td style="border:1px solid #9ca3af;padding:2px 8px">141 – 008 – 897</td></tr>
        <tr><td style="border:1px solid #9ca3af;padding:2px 8px;font-weight:600;background:#f9fafb">ZRA:</td><td style="border:1px solid #9ca3af;padding:2px 8px">Z025674759</td></tr>
      </table>
    </div>
  </div>
  <!-- To / From -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;border-bottom:1px solid #d1d5db;padding-bottom:12px;margin-bottom:12px">
    <div>
      <p style="font-weight:600;margin:0 0 6px">To: ………………………………………</p>
      ${toName}${toCompany}${toLoc}${toAddr}${toPhone}${toPoBox}${toCity}${toTin}
    </div>
    <div>
      <p style="font-weight:600;margin:0 0 6px">From: ………………………………………</p>
      <p style="font-weight:700;font-size:13px;margin:0 0 2px">HAMINASS GROUP LIMITED.</p>
      <p style="margin:0 0 2px">Mwanakwerekwe,</p>
      <p style="margin:0 0 2px">Mzee Kificho Building, Ground Floor,</p>
      <p style="margin:0 0 2px">Zanzibar – Tanzania.</p>
      <p style="margin:0 0 2px">Call/WhatsApp +255 763 303 428</p>
      <p style="margin:0 0 2px">E – Mail: info@haminass.com</p>
      <p style="margin:0">Website: http://www.haminass.com</p>
    </div>
  </div>
  <!-- Service table -->
  <p style="text-align:center;font-weight:700;font-size:13px;border:1px solid #9ca3af;padding:4px;background:#f3f4f6;letter-spacing:0.08em;margin:0">SERVICE TYPE: INVOICE</p>
  <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="border:1px solid #9ca3af;padding:4px 6px;text-align:center;width:32px">S/N</th>
        <th style="border:1px solid #9ca3af;padding:4px 6px;text-align:left;width:120px">Service Name:</th>
        <th style="border:1px solid #9ca3af;padding:4px 6px;text-align:left">Service Descriptions</th>
        <th style="border:1px solid #9ca3af;padding:4px 6px;text-align:center;width:40px">Qty</th>
        <th style="border:1px solid #9ca3af;padding:4px 6px;text-align:right;width:110px">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #9ca3af;padding:8px 6px;text-align:center;vertical-align:top">1.</td>
        <td style="border:1px solid #9ca3af;padding:8px 6px;vertical-align:top;font-weight:600">${tier.name} Sponsorship</td>
        <td style="border:1px solid #9ca3af;padding:8px 6px;vertical-align:top">
          <p style="margin:0 0 4px">${tier.description}</p>
          <ul style="margin:4px 0 0;padding:0;list-style:none">${benefits}</ul>
        </td>
        <td style="border:1px solid #9ca3af;padding:8px 6px;text-align:center;vertical-align:top">1</td>
        <td style="border:1px solid #9ca3af;padding:8px 6px;text-align:right;vertical-align:top;font-weight:600;white-space:nowrap">${fmt(sub)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="border:1px solid #9ca3af;padding:4px 6px"></td>
        <td style="border:1px solid #9ca3af;padding:4px 6px;text-align:right;font-weight:600;background:#f9fafb">Sub Total:</td>
        <td style="border:1px solid #9ca3af;padding:4px 6px;text-align:right;font-weight:700">${fmt(sub)}</td>
      </tr>
      <tr>
        <td colspan="3" style="border:1px solid #9ca3af;padding:3px 6px"></td>
        <td style="border:1px solid #9ca3af;padding:3px 6px;text-align:right;font-weight:600;background:#f9fafb">VAT (15%):</td>
        <td style="border:1px solid #9ca3af;padding:3px 6px;text-align:right">${fmt(vat)}</td>
      </tr>
      <tr>
        <td colspan="3" style="border:1px solid #9ca3af;padding:4px 6px"></td>
        <td style="border:1px solid #9ca3af;padding:4px 6px;text-align:right;font-weight:700;background:#f3f4f6">Net Total:</td>
        <td style="border:1px solid #9ca3af;padding:4px 6px;text-align:right;font-weight:900">${fmt(net)}</td>
      </tr>
    </tfoot>
  </table>
  <p style="font-size:11px;margin:4px 0"><strong>Amount in words:</strong> ${words}</p>
  <!-- Payment info -->
  <div style="border-top:1px solid #d1d5db;padding-top:8px;margin-top:8px;font-size:11px">
    <p style="font-weight:700;margin:0 0 4px">Payment information:</p>
    <p style="margin:0 0 2px">– We Accept Cash Payment limited to 2,500,000.00 Tzs.</p>
    <p style="margin:0 0 2px">– Mobile LIPA Number: 440625027</p>
    <p style="margin:0 0 6px">– Name: Haminass Group LTD, (Please add applicable withdrawal charges):</p>
    <p style="font-weight:700;margin:0 0 2px">Bank Account Details:</p>
    <p style="margin:0 0 2px">Bank Name: NATIONAL BANK OF COMMERCE (NBC),</p>
    <p style="margin:0 0 2px">Account name: HAMINASS GROUP LIMITED</p>
    <p style="font-weight:700;margin:0">Tzs. A/C No: 089186010433 | Swift code: NLCBTZTXXXX</p>
  </div>
  <p style="font-size:10px;color:#6b7280;text-align:center;font-style:italic;border-top:1px solid #e5e7eb;margin-top:10px;padding-top:8px">If you have any questions concerning this invoice, please don't hesitate to contact us through Call/WhatsApp Number +255 779 507 985 or Email Us: billings@haminass.com</p>
  <p style="font-size:10px;color:#6b7280;text-align:center;font-weight:600;margin:4px 0 10px">THANK YOU FOR GIVING A CHANCE TO DO A BUSINESS WITH YOU AGAIN!</p>
  <div style="border-top:2px solid #fb923c;padding-top:6px;font-size:9px;color:#2563eb;text-align:center">
    Address: Mwanakwerekwe – Zanzibar – Tanzania | P.O.BOX: 2704 | Tell: +255 658 338 646 | +255 710 967 616<br/>
    Email: info@haminass.com &nbsp; http://www.haminass.com
  </div>
</div>`
  }, [form, tier, application])

  const buildReceiptHTML = useCallback(() => {
    if (!application || !tier) return ''
    const origin  = window.location.origin
    const dateStr = new Date(application.submittedAt).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' })
    const sub  = tier.price
    const vat  = Math.round(sub * 0.15)
    const net  = sub + vat
    const fmt  = (n: number) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n) + ' TZS'
    const methodLabel = application.paymentMethod.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const statusColor = application.status === 'confirmed' ? '#16a34a' : '#d97706'
    const statusLabel = application.status === 'confirmed' ? 'CONFIRMED' : 'PENDING CONFIRMATION'
    return `
<div style="padding:32px;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;line-height:1.5">
  <!-- Header: logos -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0">
    <img src="${origin}/images/haminass-logo.png" style="height:56px;width:auto;object-fit:contain" crossorigin="anonymous"/>
    <img src="${origin}/images/eopsprimax-logo.png" style="height:36px;width:auto;object-fit:contain" crossorigin="anonymous"/>
  </div>
  <!-- Title band -->
  <div style="background:#1e3a5f;color:#fff;text-align:center;padding:12px 0;margin:16px 0 0">
    <p style="font-size:22px;font-weight:900;letter-spacing:0.12em;margin:0">OFFICIAL RECEIPT</p>
    <p style="font-size:11px;opacity:0.8;margin:2px 0 0">Haminass Group Limited — Sponsorship Division</p>
  </div>
  <!-- Status + meta row -->
  <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;padding:10px 16px;margin-bottom:20px">
    <div>
      <p style="font-size:10px;color:#64748b;margin:0">Receipt Number</p>
      <p style="font-size:16px;font-weight:900;font-family:monospace;color:#1e3a5f;margin:0">${application.invoiceNumber}</p>
    </div>
    <div style="text-align:center">
      <span style="display:inline-block;background:${statusColor};color:#fff;font-size:10px;font-weight:700;padding:3px 12px;border-radius:20px;letter-spacing:0.06em">${statusLabel}</span>
    </div>
    <div style="text-align:right">
      <p style="font-size:10px;color:#64748b;margin:0">Date Issued</p>
      <p style="font-size:13px;font-weight:600;margin:0">${dateStr}</p>
    </div>
  </div>
  <!-- Two columns: Sponsor + Package -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
    <!-- Sponsor Details -->
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px">
      <p style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Sponsor Details</p>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr><td style="color:#64748b;padding:3px 0;width:80px">Contact</td><td style="font-weight:600;padding:3px 0">${application.contactName}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Company</td><td style="font-weight:600;padding:3px 0">${application.companyName}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Industry</td><td style="padding:3px 0">${application.industry}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Email</td><td style="padding:3px 0">${application.contactEmail}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Phone</td><td style="padding:3px 0">${application.contactPhone}</td></tr>
        ${application.taxId ? `<tr><td style="color:#64748b;padding:3px 0">TIN</td><td style="padding:3px 0">${application.taxId}</td></tr>` : ''}
      </table>
    </div>
    <!-- Billing Address -->
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px">
      <p style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Billing Address</p>
      <p style="font-weight:700;font-size:13px;margin:0 0 4px">${application.billingName}</p>
      ${application.location ? `<p style="margin:0 0 2px">${application.location}</p>` : ''}
      ${application.billingAddress ? `<p style="margin:0 0 2px">${application.billingAddress}</p>` : ''}
      ${application.poBox ? `<p style="margin:0 0 2px">P.O.BOX ${application.poBox}</p>` : ''}
      ${application.billingCity ? `<p style="margin:0 0 2px">${application.billingCity} – ${application.billingCountry}</p>` : ''}
    </div>
  </div>
  <!-- Package + Amount -->
  <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px">
    <p style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Sponsorship Package</p>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <p style="font-size:15px;font-weight:700;color:#1e3a5f;margin:0 0 4px">${tier.name} Sponsorship</p>
        <p style="font-size:11px;color:#64748b;margin:0">${tier.description}</p>
      </div>
      <div style="text-align:right;min-width:140px">
        <table style="border-collapse:collapse;font-size:11px;width:100%">
          <tr>
            <td style="color:#64748b;padding:2px 8px;text-align:left">Sub Total</td>
            <td style="text-align:right;padding:2px 0">${fmt(sub)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding:2px 8px;text-align:left">VAT (15%)</td>
            <td style="text-align:right;padding:2px 0">${fmt(vat)}</td>
          </tr>
          <tr style="border-top:2px solid #1e3a5f">
            <td style="font-weight:700;padding:6px 8px;text-align:left;color:#1e3a5f;font-size:12px">TOTAL</td>
            <td style="font-weight:900;font-size:15px;color:#1e3a5f;text-align:right;padding:6px 0">${fmt(net)}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  <!-- Payment Details -->
  <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px;background:#f8fafc">
    <p style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Payment Details</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
      <div><p style="color:#64748b;margin:0">Payment Method</p><p style="font-weight:600;margin:0">${methodLabel}</p></div>
      <div><p style="color:#64748b;margin:0">Transaction Reference</p><p style="font-weight:600;font-family:monospace;margin:0">${application.paymentReference || '—'}</p></div>
    </div>
  </div>
  <!-- Thank you -->
  <div style="text-align:center;padding:16px 0;border-top:1px solid #e2e8f0;margin-bottom:12px">
    <p style="font-size:15px;font-weight:700;color:#1e3a5f;margin:0 0 4px">Thank you for your sponsorship!</p>
    <p style="font-size:11px;color:#64748b;margin:0">Our team will contact you within 1–2 business days to confirm your application.</p>
    <p style="font-size:11px;color:#64748b;margin:4px 0 0">Questions? Call/WhatsApp: +255 779 507 985 | Email: billings@haminass.com</p>
  </div>
  <!-- Footer -->
  <div style="border-top:2px solid #fb923c;padding-top:6px;font-size:9px;color:#2563eb;text-align:center">
    Address: Mwanakwerekwe – Zanzibar – Tanzania | P.O.BOX: 2704 | Tell: +255 658 338 646 | +255 710 967 616<br/>
    Email: info@haminass.com &nbsp; http://www.haminass.com
  </div>
</div>`
  }, [application, form, tier])

  const buildTermsHTML = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `
<div style="padding:32px;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;line-height:1.6">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1d4ed8;padding-bottom:12px;margin-bottom:20px">
    <img src="${origin}/images/haminass-logo.png" style="height:52px;width:auto;object-fit:contain" crossorigin="anonymous"/>
    <div style="text-align:right">
      <div style="font-size:16px;font-weight:900;color:#1d4ed8;letter-spacing:0.08em">TERMS &amp; CONDITIONS</div>
      <div style="font-size:10px;color:#6b7280;margin-top:2px">HAMINASS GROUP LIMITED — Sponsorship Agreement</div>
    </div>
  </div>

  <p style="margin:0 0 16px;font-size:10px;color:#6b7280">
    By submitting a sponsorship application and making payment, the Sponsor agrees to be bound by the following Terms and Conditions.
    These terms form part of the sponsorship agreement between the Sponsor and HAMINASS GROUP LIMITED.
  </p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 24px">

    <div>
      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">1. AGREEMENT</p>
      <p style="margin:0 0 12px">Submission of the sponsorship application and receipt of payment constitutes acceptance of these Terms and Conditions. HAMINASS GROUP LIMITED reserves the right to amend these terms with reasonable prior notice.</p>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">2. SPONSORSHIP PACKAGES</p>
      <p style="margin:0 0 12px">All sponsorship packages and their associated benefits are as described in the invoice. HAMINASS GROUP LIMITED reserves the right to make reasonable adjustments to package details where circumstances require, with prior notification to the Sponsor.</p>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">3. PAYMENT TERMS</p>
      <ul style="margin:0 0 12px;padding-left:16px">
        <li style="margin-bottom:3px">Full payment is due within 14 days of the invoice date.</li>
        <li style="margin-bottom:3px">Accepted methods: bank transfer, Mobile Lipa Number, or as otherwise agreed in writing.</li>
        <li style="margin-bottom:3px">All quoted prices are inclusive of VAT at the applicable rate (currently 15%).</li>
        <li style="margin-bottom:3px">Payments received after the due date may incur a late-payment fee of 5% per month.</li>
      </ul>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">4. CANCELLATION &amp; REFUNDS</p>
      <ul style="margin:0 0 12px;padding-left:16px">
        <li style="margin-bottom:3px">30+ days before the event: 50% refund of the amount paid.</li>
        <li style="margin-bottom:3px">14–29 days before the event: 25% refund of the amount paid.</li>
        <li style="margin-bottom:3px">Less than 14 days before the event: No refund.</li>
        <li style="margin-bottom:3px">Should HAMINASS GROUP LIMITED cancel or postpone the event, a full refund will be issued within 30 days.</li>
      </ul>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">5. SPONSOR OBLIGATIONS</p>
      <p style="margin:0 0 4px">The Sponsor agrees to:</p>
      <ul style="margin:0 0 12px;padding-left:16px">
        <li style="margin-bottom:3px">Provide logos, artwork, and required materials in agreed formats within agreed timescales.</li>
        <li style="margin-bottom:3px">Ensure all submitted materials comply with applicable laws, regulations, and do not infringe any third-party rights.</li>
        <li style="margin-bottom:3px">Not make any representation on behalf of HAMINASS GROUP LIMITED without prior written consent.</li>
      </ul>
    </div>

    <div>
      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">6. INTELLECTUAL PROPERTY</p>
      <p style="margin:0 0 12px">Each party retains ownership of their respective intellectual property. The Sponsor grants HAMINASS GROUP LIMITED a non-exclusive, royalty-free licence to use the Sponsor's name, logo, and trademarks solely for the purpose of fulfilling the sponsorship obligations during the event period.</p>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">7. LIMITATION OF LIABILITY</p>
      <p style="margin:0 0 12px">HAMINASS GROUP LIMITED shall not be liable for any indirect, incidental, special, or consequential losses or damages arising from the sponsorship arrangement. Our total aggregate liability to the Sponsor shall not exceed the total amount paid by the Sponsor under the relevant invoice.</p>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">8. CONFIDENTIALITY</p>
      <p style="margin:0 0 12px">Both parties agree to keep confidential any proprietary or sensitive information disclosed during the sponsorship arrangement and not to disclose such information to any third party without prior written consent, except as required by law.</p>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">9. FORCE MAJEURE</p>
      <p style="margin:0 0 12px">Neither party shall be liable for failure to perform its obligations if such failure results from circumstances beyond their reasonable control, including but not limited to acts of God, government restrictions, or public health emergencies. The affected party shall notify the other as soon as reasonably practicable.</p>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">10. GOVERNING LAW &amp; DISPUTES</p>
      <p style="margin:0 0 12px">These Terms and Conditions are governed by and construed in accordance with the laws of the United Republic of Tanzania. Any disputes arising shall be subject to the exclusive jurisdiction of the courts of Zanzibar, Tanzania. The parties shall first attempt to resolve disputes amicably before initiating legal proceedings.</p>

      <p style="font-weight:700;font-size:12px;color:#1d4ed8;margin:0 0 4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">11. ENTIRE AGREEMENT</p>
      <p style="margin:0 0 12px">These Terms and Conditions, together with the invoice, constitute the entire agreement between the parties with respect to the subject matter hereof and supersede all prior agreements, representations, and understandings.</p>
    </div>
  </div>

  <!-- Signatures -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px">
    <div>
      <p style="font-weight:600;margin:0 0 32px">For and on behalf of the Sponsor:</p>
      <div style="border-bottom:1px solid #111;width:80%;margin-bottom:4px"></div>
      <p style="margin:0;font-size:10px;color:#6b7280">Authorised Signatory &amp; Date</p>
    </div>
    <div>
      <p style="font-weight:600;margin:0 0 32px">For and on behalf of HAMINASS GROUP LIMITED:</p>
      <div style="border-bottom:1px solid #111;width:80%;margin-bottom:4px"></div>
      <p style="margin:0;font-size:10px;color:#6b7280">Authorised Signatory &amp; Date</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="border-top:2px solid #f97316;margin-top:20px;padding-top:8px;font-size:9px;color:#2563eb;text-align:center">
    HAMINASS GROUP LIMITED | Mwanakwerekwe, Mzee Kificho Building, Ground Floor, Zanzibar – Tanzania<br/>
    P.O.BOX: 2704 | Tel: +255 658 338 646 / +255 710 967 616 | Email: info@haminass.com | www.haminass.com
  </div>
</div>`
  }, [])

  const downloadInvoice = useCallback(async () => {
    setDownloading(true)
    try {
      const html = buildInvoiceHTML()
      if (!html) return
      const name = `invoice-${(application?.invoiceNumber || tier?.name || 'sponsorship').replace(/\s+/g, '-').toLowerCase()}.pdf`
      // T&C page is appended to the downloaded PDF but is NOT shown in the on-screen preview
      await captureHtmlAsPDF(html, name, buildTermsHTML())
    } catch (err) { console.error('Invoice download failed', err) }
    finally { setDownloading(false) }
  }, [buildInvoiceHTML, buildTermsHTML, captureHtmlAsPDF, application, tier])

  const downloadReceipt = useCallback(async () => {
    setDownloadingReceipt(true)
    try {
      const html = buildReceiptHTML()
      if (!html) return
      const name = `receipt-${(application?.invoiceNumber || 'sponsorship').replace(/\s+/g, '-').toLowerCase()}.pdf`
      await captureHtmlAsPDF(html, name)
    } catch (err) { console.error('Receipt download failed', err) }
    finally { setDownloadingReceipt(false) }
  }, [buildReceiptHTML, captureHtmlAsPDF, application])

  const handleNext   = () => { if (!validate(step)) return; setStep(s => s + 1) }
  const handleSubmit = async () => {
    if (!tier) return
    if (!validate(2)) return
    setSubmitting(true)

    // ── Card payment: one-stage direct API (no redirect) ────────────────────
    if (isCard) {
      try {
        const appData = {
          companyName:      form.companyName.trim(),
          contactName:      form.contactName.trim(),
          contactEmail:     form.contactEmail.trim(),
          contactPhone:     form.contactPhone.trim(),
          website:          form.website.trim() || undefined,
          industry:         form.industry.trim(),
          billingName:      form.billingName.trim(),
          billingEmail:     form.billingEmail.trim(),
          billingAddress:   form.billingAddress.trim(),
          location:         form.location.trim() || undefined,
          poBox:            form.poBox.trim() || undefined,
          billingCity:      form.billingCity.trim(),
          billingCountry:   form.billingCountry.trim(),
          taxId:            form.taxId.trim() || undefined,
          tierId:           tier.id,
          tierName:         tier.name,
          amount:           tier.price,
          currency:         tier.currency,
          paymentMethod:    form.paymentMethod as SponsorshipApplication['paymentMethod'],
          paymentReference: '',
          notes:            form.notes.trim() || undefined,
        }
        const res = await fetch('/api/sponsorship/charge-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationData: appData,
            tierPrice: tier.price,
            card: {
              pan:    form.cardNumber,
              expiry: form.cardExpiry,
              cvv:    form.cardCvv,
              name:   form.cardName,
            },
            browserInfo: {
              acceptHeader:    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              colorDepth:      window.screen.colorDepth,
              javaEnabled:     false,
              language:        navigator.language,
              screenHeight:    window.screen.height,
              screenWidth:     window.screen.width,
              timeZoneOffset:  new Date().getTimezoneOffset(),
              userAgent:       navigator.userAgent,
            },
          }),
        })
        let data: Record<string, unknown>
        try { data = await res.json() } catch { data = {} }

        if (!res.ok) {
          setErrors({ paymentMethod: (data.error as string) || 'Payment failed. Please try again.' })
          setSubmitting(false)
          return
        }

        if (data.success) {
          const app = await fetchApplication(data.applicationId as string)
          if (app) { setApp(app); setStep(3) }
          else setStep(3)
          setSubmitting(false)
          return
        }

        if (data.needs3DSMethod) {
          setMethod({
            threeDSMethodURL:     data.threeDSMethodURL     as string,
            threeDSServerTransID: data.threeDSServerTransID as string,
            methodNotifyUrl:      data.methodNotifyUrl      as string,
            orderRef:             data.orderRef             as string,
            paymentId:            data.paymentId            as string,
            applicationId:        data.applicationId        as string,
            invoiceNumber:        data.invoiceNumber        as string,
            browserInfo: {
              acceptHeader:   'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              colorDepth:     window.screen.colorDepth,
              language:       navigator.language,
              screenHeight:   window.screen.height,
              screenWidth:    window.screen.width,
              timeZoneOffset: new Date().getTimezoneOffset(),
              userAgent:      navigator.userAgent,
            },
          })
          setSubmitting(false)
          return
        }

        if (data.needs3DSChallenge) {
          setChallenge({
            orderRef:      data.orderRef      as string,
            paymentId:     data.paymentId     as string,
            applicationId: data.applicationId as string,
            invoiceNumber: data.invoiceNumber as string,
            acsUrl:        data.acsUrl        as string,
            creq:          data.creq          as string,
            notifyUrl:     data.notifyUrl     as string,
          })
          setSubmitting(false)
          return
        }

        setErrors({ paymentMethod: (data.error as string) || 'Payment failed. Please try again.' })
        setSubmitting(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.'
        setErrors({ paymentMethod: msg })
        setSubmitting(false)
      }
      return
    }

    // ── Manual payment: save locally and show receipt ────────────────────────
    await new Promise(r => setTimeout(r, 1500))
    const ref = (isLipaNumber || isBankTransfer)
      ? (form.paymentReference.trim() || `REF-${Date.now().toString(36).toUpperCase()}`)
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
      location:       form.location.trim() || undefined,
      poBox:          form.poBox.trim() || undefined,
      billingCity:    form.billingCity.trim(),
      billingCountry: form.billingCountry.trim(),
      taxId:          form.taxId.trim() || undefined,
      tierId:         tier.id,
      tierName:       tier.name,
      amount:         tier.price,
      currency:       tier.currency,
      paymentMethod:  form.paymentMethod as SponsorshipApplication['paymentMethod'],
      paymentReference: ref,
      receiptUrl:     (isLipaNumber || isBankTransfer) ? (form.receiptDataUrl || undefined) : undefined,
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
                  <Select value={form.industry} onValueChange={v => patch({ industry: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry…" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Field label="Street / Building Address" required error={errors.billingAddress}>
                    <Input value={form.billingAddress} onChange={e => patch({ billingAddress: e.target.value })} placeholder="e.g. Mazrui Street, Ground Floor" />
                  </Field>
                </div>

                <Field label="Area / Location">
                  <Input value={form.location} onChange={e => patch({ location: e.target.value })} placeholder="e.g. Mtoni, Mazrui Street" />
                </Field>
                <Field label="P.O. BOX Number">
                  <Input value={form.poBox} onChange={e => patch({ poBox: e.target.value })} placeholder="e.g. 3208" />
                </Field>

                <Field label="City" required error={errors.billingCity}>
                  <Input value={form.billingCity} onChange={e => patch({ billingCity: e.target.value })} placeholder="Zanzibar" />
                </Field>
                <Field label="Country" required error={errors.billingCountry}>
                  <Input value={form.billingCountry} onChange={e => patch({ billingCountry: e.target.value })} placeholder="Tanzania" />
                </Field>

                <Field label="Tax ID / TIN" required error={errors.taxId}>
                  <Input value={form.taxId} onChange={e => patch({ taxId: e.target.value })} placeholder="e.g. 123-456-789" />
                </Field>
                <Field label="Additional Notes (optional)">
                  <Textarea value={form.notes} onChange={e => patch({ notes: e.target.value })} placeholder="Any special requirements or questions?" rows={2} />
                </Field>
              </div>

              {/* Invoice preview */}
              {(form.billingName || form.companyName) && (
                <div className="mt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Invoice Preview</p>
                  <div className="rounded-xl border border-border p-4 bg-white overflow-x-auto">
                    <InvoiceDoc form={form} tier={tier} />
                  </div>
                </div>
              )}

              {/* T&C Checkbox */}
              <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                <input
                  type="checkbox"
                  id="sponsorship-terms"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                />
                <label htmlFor="sponsorship-terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  I have read and agree to the{' '}
                  <a href="/terms/sponsorship" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline underline-offset-2">
                    Sponsorship Terms &amp; Conditions
                  </a>
                </label>
              </div>
            </div>
          )}

          {/* ── Step 2: Payment ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionHead icon={CreditCard} title="Payment Method" sub="Choose how you'd like to pay for this sponsorship" />

              <div className="rounded-xl border bg-secondary/30 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sponsorship Package</p>
                  <p className="font-bold text-foreground">{tier.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Amount (incl. 15% VAT)</p>
                  <p className="text-2xl font-extrabold text-primary">
                    {fmtCurrency(Math.round(tier.price * 1.15), tier.currency)}
                  </p>
                </div>
              </div>

              {errors.paymentMethod && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />{errors.paymentMethod}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Lipa Number — active */}
                <button
                  type="button"
                  onClick={() => patch({ paymentMethod: 'lipa-number', paymentReference: '', receiptDataUrl: '', receiptName: '' })}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                    form.paymentMethod === 'lipa-number'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <Image src={assetUrl('/images/lipa-number-logo.jpg')} alt="Lipa Number" width={72} height={28} className="h-7 w-auto object-contain rounded" />
                  <p className="text-xs font-semibold text-foreground">LIPA NUMBER</p>
                  <p className="text-[10px] text-muted-foreground">Mobile money transfer</p>
                  {form.paymentMethod === 'lipa-number' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                {/* Bank Transfer — active */}
                <button
                  type="button"
                  onClick={() => patch({ paymentMethod: 'bank-transfer', paymentReference: '', receiptDataUrl: '', receiptName: '' })}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
                    form.paymentMethod === 'bank-transfer'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <Building2 className="h-7 w-7 text-blue-600" />
                  <p className="text-xs font-semibold text-foreground">BANK TRANSFER</p>
                  <p className="text-[10px] text-muted-foreground">NBC bank deposit</p>
                  {form.paymentMethod === 'bank-transfer' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                {/* M-Pesa — Coming Soon */}
                <div className="flex flex-col items-start gap-2 rounded-xl border-2 border-border p-4 opacity-50 cursor-not-allowed select-none">
                  <Image src={assetUrl('/images/mpesa-logo.png')} alt="M-Pesa" width={72} height={28} className="h-7 w-auto object-contain" />
                  <p className="text-xs font-semibold text-foreground">M-PESA</p>
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Coming Soon</span>
                </div>
              </div>

              {/* Bank Transfer — account details + receipt */}
              {isBankTransfer && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">Bank Transfer Instructions</p>
                  <div className="rounded-lg bg-background border border-border p-4 space-y-1.5 text-sm">
                    <p className="font-semibold text-foreground">Transfer to this account:</p>
                    <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-medium text-foreground">National Bank of Commerce (NBC)</span>
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-medium text-foreground">HAMINASS GROUP LIMITED</span>
                      <span className="text-muted-foreground">Account No.</span>
                      <span className="font-mono font-bold text-foreground tracking-wider">089186010433</span>
                      <span className="text-muted-foreground">Swift Code</span>
                      <span className="font-mono text-foreground">NLCBTZTXXXX</span>
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-primary">{fmtCurrency(Math.round(tier.price * 1.15), tier.currency)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    After completing the bank transfer, enter your transaction reference number and upload the bank deposit slip below.
                    Your application will be confirmed once an admin reviews the payment.
                  </p>
                  {errors.paymentReference && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />{errors.paymentReference}
                    </p>
                  )}
                  <Field label="Transaction Reference Number">
                    <Input
                      value={form.paymentReference}
                      onChange={e => patch({ paymentReference: e.target.value })}
                      placeholder="e.g. NBC20240001234"
                      className="font-mono bg-background"
                    />
                  </Field>
                  <div className="relative py-1 text-center text-xs text-muted-foreground">
                    <span className="bg-primary/5 px-2">— or upload deposit slip —</span>
                  </div>
                  <label
                    htmlFor="bankReceiptUpload"
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
                        <p className="text-sm font-medium text-foreground">Click to upload deposit slip</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </>
                    )}
                    <input
                      id="bankReceiptUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleReceiptChange(e.target.files?.[0] || null)}
                    />
                  </label>
                  {form.receiptDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.receiptDataUrl} alt="Deposit slip preview" className="max-h-48 w-auto rounded-lg border border-border object-contain" />
                  )}
                </div>
              )}

              {/* Mobile money — phone number input */}
              {!isCard && !isLipaNumber && !isBankTransfer && form.paymentMethod && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">
                    {form.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Mixx by Yas'} Phone Number
                  </p>
                  <Field label="Phone Number" required error={errors.paymentReference}>
                    <Input
                      value={form.paymentReference}
                      onChange={e => patch({ paymentReference: e.target.value })}
                      placeholder="+255 7XX XXX XXX"
                      type="tel"
                    />
                  </Field>
                </div>
              )}

              {/* Lipa Number — receipt upload */}
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
                    alt="Scan to pay via Lipa Number"
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
                          'absolute right-2.5 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wider',
                          BRAND_META[detectedBrand].color
                        )}>
                          {BRAND_META[detectedBrand].label}
                        </span>
                      )}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry (MM/YY)" required error={errors.cardExpiry}>
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
                        <button type="button" onClick={() => setShowCvv(v => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showCvv ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </Field>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    🔒 Card details are sent directly to NBC — never stored on our server.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2 continued: Review summary ──────────────────────────── */}
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
                  {([['Name', form.billingName], ['Email', form.billingEmail], ['Address', form.billingAddress], ['City', form.billingCity], ['TIN', form.taxId]] as [string,string][]).map(([k,v]) => v ? (
                    <div key={k}><p className="text-[10px] text-muted-foreground">{k}</p><p className="text-sm font-medium text-foreground break-words">{v}</p></div>
                  ) : null)}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
                <p className="font-bold text-foreground">{tier.name} Sponsorship Package</p>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">incl. 15% VAT</p>
                  <p className="text-xl font-extrabold text-primary">
                    {fmtCurrency(Math.round(tier.price * 1.15), tier.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Receipt + Invoice ──────────────────────────────────── */}
          {step === 3 && application && (
            <div className="space-y-5">
              {/* Success banner */}
              <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-800 dark:text-green-300">Application Submitted Successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">
                    Our sponsorship team will review your application and contact you within 1–2 business days to confirm.
                  </p>
                </div>
              </div>

              {/* ── Tab switcher ── */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setDocTab('receipt')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${docTab === 'receipt' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                >
                  Receipt
                </button>
                <button
                  onClick={() => setDocTab('invoice')}
                  className={`flex-1 py-2.5 text-sm font-semibold border-l border-border transition-colors ${docTab === 'invoice' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                >
                  Invoice
                </button>
              </div>

              {/* ── Receipt tab ── */}
              {docTab === 'receipt' && (
                <div className="rounded-xl border border-border bg-white overflow-hidden text-[13px]" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/haminass-logo.png" alt="Haminass" className="h-10 w-auto object-contain" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/eopsprimax-logo.png" alt="eOpsprimax" className="h-7 w-auto object-contain" />
                  </div>
                  <div className="text-center py-3 px-4" style={{ background: '#1e3a5f', color: '#fff' }}>
                    <p className="font-black text-xl tracking-widest m-0">OFFICIAL RECEIPT</p>
                    <p className="text-xs mt-1 m-0" style={{ opacity: 0.75 }}>Haminass Group Limited — Sponsorship Division</p>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={{ background: '#f8fafc' }}>
                    <div>
                      <p className="text-[10px] text-gray-500 m-0">Receipt Number</p>
                      <p className="font-mono font-black text-base m-0" style={{ color: '#1e3a5f' }}>{application.invoiceNumber}</p>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: application.status === 'confirmed' ? '#16a34a' : '#d97706' }}>
                      {application.status === 'confirmed' ? 'CONFIRMED' : 'PENDING CONFIRMATION'}
                    </span>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 m-0">Date Issued</p>
                      <p className="font-semibold text-sm m-0">{new Date(application.submittedAt).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-100">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Sponsor Details</p>
                      {[
                        ['Contact',  application.contactName],
                        ['Company',  application.companyName],
                        ['Industry', application.industry],
                        ['Email',    application.contactEmail],
                        ['Phone',    application.contactPhone],
                        ...(application.taxId ? [['TIN', application.taxId]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex gap-2 py-0.5 text-[11px]">
                          <span className="text-gray-500 w-16 shrink-0">{k}</span>
                          <span className="font-semibold text-gray-800 break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Billing Address</p>
                      <p className="font-bold text-sm text-gray-800 m-0">{application.billingName}</p>
                      {application.location    && <p className="text-[11px] text-gray-600 m-0 mt-0.5">{application.location}</p>}
                      {application.billingAddress && <p className="text-[11px] text-gray-600 m-0 mt-0.5">{application.billingAddress}</p>}
                      {application.poBox       && <p className="text-[11px] text-gray-600 m-0 mt-0.5">P.O.BOX {application.poBox}</p>}
                      {application.billingCity && <p className="text-[11px] text-gray-600 m-0 mt-0.5">{application.billingCity} – {application.billingCountry}</p>}
                    </div>
                  </div>
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-3">Sponsorship Package</p>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-base m-0" style={{ color: '#1e3a5f' }}>{tier.name} Sponsorship</p>
                        <p className="text-[11px] text-gray-500 mt-1 m-0">{tier.description}</p>
                      </div>
                      <div className="shrink-0 min-w-[150px]">
                        {[
                          ['Sub Total', fmtCurrency(tier.price, tier.currency)],
                          ['VAT (15%)', fmtCurrency(Math.round(tier.price * 0.15), tier.currency)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 text-[11px] py-0.5">
                            <span className="text-gray-500">{k}</span>
                            <span>{v}</span>
                          </div>
                        ))}
                        <div className="flex justify-between gap-4 pt-2 mt-1 border-t-2 font-black" style={{ borderColor: '#1e3a5f' }}>
                          <span style={{ color: '#1e3a5f' }}>TOTAL</span>
                          <span className="text-base" style={{ color: '#1e3a5f' }}>{fmtCurrency(Math.round(tier.price * 1.15), tier.currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-b border-gray-100" style={{ background: '#f8fafc' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Payment Details</p>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <p className="text-gray-500 m-0">Payment Method</p>
                        <p className="font-semibold m-0">{application.paymentMethod.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 m-0">{application.paymentMethod === 'mpesa' || application.paymentMethod === 'mpesa-mixx' ? 'Phone Number' : 'Reference'}</p>
                        <p className="font-mono font-semibold m-0">{application.paymentReference || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center px-4 py-4">
                    <p className="font-bold text-base m-0" style={{ color: '#1e3a5f' }}>Thank you for your sponsorship!</p>
                    <p className="text-[11px] text-gray-500 mt-1 m-0">Our team will contact you within 1–2 business days to confirm your application.</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 m-0">Questions? +255 779 507 985 | billings@haminass.com</p>
                  </div>
                  <div className="text-center text-[9px] px-4 py-2 border-t-2 border-orange-400" style={{ color: '#2563eb' }}>
                    Address: Mwanakwerekwe – Zanzibar – Tanzania | P.O.BOX: 2704 | Tel: +255 658 338 646<br />
                    Email: info@haminass.com &nbsp; http://www.haminass.com
                  </div>
                </div>
              )}

              {/* ── Invoice tab ── */}
              {docTab === 'invoice' && (
                <div className="rounded-xl border border-border bg-white p-5 overflow-x-auto">
                  <InvoiceDoc
                    form={form}
                    tier={tier}
                    invoiceNumber={application.invoiceNumber}
                    issuedAt={application.submittedAt}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom navigation bar ─────────────────────────────────────────── */}
      <div className="no-print shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
          {step === 0 && <Button variant="outline" onClick={onClose}>Cancel</Button>}
          {step > 0 && step < 3 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
          )}
          {step === 3 && <Button variant="outline" onClick={onClose}>Close</Button>}

          <div className="flex items-center gap-2">
            {/* Download button visible at billing step (step 1) as soon as invoice preview appears */}
            {step === 1 && (form.billingName || form.companyName) && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2"
                disabled={downloading}
                onClick={downloadInvoice}
              >
                {downloading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : <><Download className="h-4 w-4" /> Download Invoice</>
                }
              </Button>
            )}
            {step < 2 && (
              <Button onClick={handleNext} size="lg" className="gap-2 px-8" disabled={step === 1 && !agreedToTerms}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (() => {
              const lipaIncomplete   = (isLipaNumber || isBankTransfer) && !form.receiptDataUrl && !form.paymentReference.trim()
              const mobileIncomplete = !isCard && !isLipaNumber && !isBankTransfer && !!form.paymentMethod && !form.paymentReference.trim()
              const cardIncomplete   = isCard && (
                form.cardNumber.replace(/\s/g, '').length < 16 ||
                form.cardExpiry.length < 5 || form.cardCvv.length < 3 || !form.cardName.trim()
              )
              const blocked = !form.paymentMethod || lipaIncomplete || mobileIncomplete || cardIncomplete
              const hint = !form.paymentMethod ? 'Select a payment method'
                         : lipaIncomplete      ? 'Upload receipt/deposit slip or enter reference number'
                         : mobileIncomplete    ? 'Enter your phone number'
                         : undefined
              return (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || blocked}
                  size="lg"
                  className="gap-2 px-8"
                  title={hint}
                >
                  {submitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {isCard ? 'Processing payment…' : 'Submitting…'}</>
                    : isCard
                      ? <><CreditCard className="h-4 w-4" /> Pay with {form.paymentMethod === 'visa' ? 'Visa' : 'Mastercard'}</>
                      : <><CheckCircle2 className="h-4 w-4" /> Confirm & Submit</>
                  }
                </Button>
              )
            })()}
            {step === 3 && docTab === 'receipt' && (
              <Button onClick={downloadReceipt} disabled={downloadingReceipt} size="lg" className="gap-2">
                {downloadingReceipt
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : <><Download className="h-4 w-4" /> Download Receipt</>
                }
              </Button>
            )}
            {step === 3 && docTab === 'invoice' && (
              <Button onClick={downloadInvoice} disabled={downloading} size="lg" className="gap-2">
                {downloading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : <><Download className="h-4 w-4" /> Download Invoice</>
                }
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3DS Method overlay (device fingerprinting) ───────────────────── */}
      {method && (
        <ThreeDSMethod
          method={method}
          onDone={async (methodCompleted) => {
            const m = method
            setMethod(null)
            try {
              const res = await fetch('/api/sponsorship/3ds/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderRef:      m.orderRef,
                  paymentId:     m.paymentId,
                  applicationId: m.applicationId,
                  invoiceNumber: m.invoiceNumber,
                  browserInfo:   m.browserInfo,
                  methodCompleted,
                }),
              })
              let data: Record<string, unknown>
              try { data = await res.json() } catch { data = {} }
              if (!res.ok) {
                setErrors({ paymentMethod: (data.error as string) || 'Verification failed. Please try again.' })
                return
              }
              if (data.success) {
                const app = await fetchApplication(data.applicationId as string)
                if (app) setApp(app)
                setStep(3)
                return
              }
              if (data.needs3DSChallenge) {
                setChallenge({
                  orderRef:      data.orderRef      as string,
                  paymentId:     data.paymentId     as string,
                  applicationId: data.applicationId as string,
                  invoiceNumber: data.invoiceNumber as string,
                  acsUrl:        data.acsUrl        as string,
                  creq:          data.creq          as string,
                  notifyUrl:     data.notifyUrl     as string,
                })
                return
              }
              setErrors({ paymentMethod: (data.error as string) || 'Verification failed. Please try again.' })
            } catch {
              setErrors({ paymentMethod: 'Verification failed. Please try again.' })
            }
          }}
        />
      )}

      {/* ── 3DS Challenge overlay ─────────────────────────────────────────── */}
      {challenge && (
        <ThreeDSChallenge
          challenge={challenge}
          onSuccess={async () => {
            const app = await fetchApplication(challenge.applicationId)
            setChallenge(null)
            if (app) setApp(app)
            setStep(3)
          }}
          onFailure={(msg) => {
            setChallenge(null)
            setErrors({ paymentMethod: msg || '3DS authentication failed. Please try again.' })
          }}
        />
      )}
    </div>
  )
}

// ── 3DS Method component (hidden device fingerprinting iframe) ────────────────
function ThreeDSMethod({
  method,
  onDone,
}: {
  method: {
    threeDSMethodURL: string; threeDSServerTransID: string; methodNotifyUrl: string
    orderRef: string; paymentId: string; applicationId: string; invoiceNumber: string
    browserInfo: Record<string, unknown>
  }
  onDone: (methodCompleted: boolean) => void
}) {
  const done = useRef(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '3ds_method_done' && !done.current) {
        done.current = true
        onDone(true)
      }
    }
    window.addEventListener('message', handler)
    // Timeout: if bank doesn't respond in 10s, proceed anyway with N
    const timer = setTimeout(() => {
      if (!done.current) { done.current = true; onDone(false) }
    }, 10000)
    return () => { window.removeEventListener('message', handler); clearTimeout(timer) }
  }, [onDone])

  const methodData = btoa(JSON.stringify({
    threeDSMethodNotificationURL: method.methodNotifyUrl,
    threeDSServerTransID: method.threeDSServerTransID,
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const srcdoc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body onload="document.getElementById('f').submit()">
<form id="f" method="POST" action="${method.threeDSMethodURL}">
  <input type="hidden" name="threeDSMethodData" value="${methodData}"/>
</form>
</body></html>`

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your card with your bank…</p>
        <iframe srcDoc={srcdoc} style={{ display: 'none' }} title="3DS Method" sandbox="allow-forms allow-scripts allow-same-origin" />
      </div>
    </div>
  )
}

// ── 3DS Challenge overlay component ──────────────────────────────────────────
function ThreeDSChallenge({
  challenge,
  onSuccess,
  onFailure,
}: {
  challenge: {
    orderRef: string; paymentId: string; applicationId: string
    invoiceNumber: string; acsUrl: string; creq: string; notifyUrl: string
  }
  onSuccess: () => void
  onFailure: (msg?: string) => void
}) {
  const [completing, setCompleting] = useState(false)

  const srcdoc = challenge.acsUrl ? `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body onload="document.getElementById('f').submit()" style="margin:0;background:#f8fafc">
  <form id="f" method="POST" action="${challenge.acsUrl}">
    <input type="hidden" name="creq" value="${challenge.creq}"/>
  </form>
  <p style="font-family:sans-serif;font-size:13px;color:#666;text-align:center;margin-top:40px">
    Loading bank verification…
  </p>
</body></html>` : `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;font-family:sans-serif;text-align:center;padding:40px">
  <p style="color:#666">Waiting for bank 3DS challenge…</p>
</body></html>`

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.data?.type !== '3ds_challenge_done') return
      const cres = e.data.cres as string
      if (!cres) { onFailure('No challenge response received'); return }
      setCompleting(true)
      try {
        const res = await fetch('/api/sponsorship/3ds/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef:      challenge.orderRef,
            paymentId:     challenge.paymentId,
            cres,
            applicationId: challenge.applicationId,
          }),
        })
        const data = await res.json()
        if (data.success) { onSuccess() }
        else { onFailure(data.error || 'Payment not completed after 3DS') }
      } catch (err) {
        onFailure(err instanceof Error ? err.message : '3DS completion failed')
      } finally { setCompleting(false) }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [challenge, onSuccess, onFailure])

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-bold text-sm">Bank Verification (3DS)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Complete the security check from your bank</p>
          </div>
          {completing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        {completing ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Confirming payment…</p>
          </div>
        ) : (
          <iframe
            srcDoc={srcdoc}
            className="w-full border-0"
            style={{ height: '420px' }}
            title="3DS Bank Verification"
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
          />
        )}
        <div className="px-5 py-3 border-t border-border bg-muted/30 text-center">
          <p className="text-[10px] text-muted-foreground">🔒 Secure verification — {challenge.invoiceNumber}</p>
        </div>
      </div>
    </div>
  )
}

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
          <img src="/images/eopsprimax-logo.png" alt="eOpsprimax" className="h-16 w-auto object-contain" />
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
  paymentMethod: '', paymentReference: '', notes: '',
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
  const scrollRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setStep(0); setForm(EMPTY); setErrors({}); setApp(null); setDocTab('receipt')
      setMethods(getPaymentMethods()); setSettings(getSiteSettings())
    }
  }, [open])

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  const patch = (p: Partial<FormData>) => setForm(f => ({ ...f, ...p }))
  const isCard       = form.paymentMethod === 'visa' || form.paymentMethod === 'mastercard'
  const isLipaNumber = form.paymentMethod === 'lipa-number'
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
      // Card: NBC handles input on their page — no local field validation needed
      if (!isCard) {
        if (isLipaNumber) {
          if (!form.receiptDataUrl && !form.paymentReference.trim())
            e.paymentReference = 'Please upload your payment receipt or enter the reference number'
        } else if (form.paymentMethod) {
          if (!form.paymentReference.trim()) e.paymentReference = 'Phone number is required'
        }
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const [downloading, setDownloading] = useState(false)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)

  // Renders an HTML string in an isolated container on document.body (no oklch),
  // captures it with html2canvas, and saves as PDF.
  const captureHtmlAsPDF = useCallback(async (html: string, filename: string) => {
    const html2canvas = (await import('html2canvas')).default
    const jsPDF       = (await import('jspdf')).default
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
        onclone: (clonedDoc) => {
          // Strip ALL stylesheets from the clone — our HTML is fully inline-styled,
          // so removing them prevents html2canvas from trying to parse oklch/lab colors
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove())
        },
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH  = (canvas.height / canvas.width) * pageW
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH)
      } else {
        const chunkH = Math.floor(canvas.width * (pageH / pageW))
        let y = 0; let first = true
        while (y < canvas.height) {
          if (!first) pdf.addPage()
          const sh = Math.min(chunkH, canvas.height - y)
          const sc = document.createElement('canvas'); sc.width = canvas.width; sc.height = sh
          sc.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, sh, 0, 0, canvas.width, sh)
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, (sh / canvas.width) * pageW)
          y += chunkH; first = false
        }
      }
      pdf.save(filename)
    } finally {
      document.body.removeChild(wrap)
    }
  }, [])

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
    <img src="${origin}/images/eopsprimax-logo.png" style="height:60px;width:auto;object-fit:contain" crossorigin="anonymous"/>
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
    <img src="${origin}/images/eopsprimax-logo.png" style="height:56px;width:auto;object-fit:contain" crossorigin="anonymous"/>
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

  const downloadInvoice = useCallback(async () => {
    setDownloading(true)
    try {
      const html = buildInvoiceHTML()
      if (!html) return
      const name = `invoice-${(application?.invoiceNumber || tier?.name || 'sponsorship').replace(/\s+/g, '-').toLowerCase()}.pdf`
      await captureHtmlAsPDF(html, name)
    } catch (err) { console.error('Invoice download failed', err) }
    finally { setDownloading(false) }
  }, [buildInvoiceHTML, captureHtmlAsPDF, application, tier])

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

    // ── Card payment: create NGenius order and redirect to NBC payment page ──
    if (isCard) {
      try {
        const res = await fetch('/api/sponsorship/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationData: {
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
            },
            tierPrice:    tier.price,
            tierCurrency: tier.currency,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create payment order')
        // Redirect to NBC's payment page — user comes back to /payment/sponsorship-callback
        window.location.href = data.paymentUrl
      } catch (err) {
        console.error('[sponsorship card payment]', err)
        setErrors({ paymentMethod: err instanceof Error ? err.message : 'Payment initiation failed. Please try again.' })
        setSubmitting(false)
      }
      return
    }

    // ── Manual payment: save locally and show receipt ────────────────────────
    await new Promise(r => setTimeout(r, 1500))
    const ref = isLipaNumber
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
                  <p className="text-[10px] text-muted-foreground">Enter phone number</p>
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
                  <p className="text-[10px] text-muted-foreground">Enter phone number</p>
                  {form.paymentMethod === 'mpesa-mixx' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                {/* Lipa Number */}
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

                {/* Card */}
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

              {/* Mobile money — phone number input */}
              {!isCard && !isLipaNumber && form.paymentMethod && (
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
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {form.paymentMethod === 'visa' ? 'Visa' : 'Mastercard'} — Secure Payment via NBC
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You will be redirected to NBC&apos;s secure payment page to enter your card details.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-background border border-border p-3 text-xs text-muted-foreground space-y-1">
                    <p>✅ Card details entered on NBC&apos;s PCI-compliant page — never stored on our server</p>
                    <p>✅ After payment NBC redirects you back here automatically</p>
                    <p>✅ Your sponsorship is confirmed instantly once payment succeeds</p>
                  </div>
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
                    <img src="/images/eopsprimax-logo.png" alt="eOpsprimax" className="h-10 w-auto object-contain" />
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
              <Button onClick={handleNext} size="lg" className="gap-2 px-8">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (() => {
              const lipaIncomplete   = isLipaNumber && !form.receiptDataUrl && !form.paymentReference.trim()
              const mobileIncomplete = !isCard && !isLipaNumber && !!form.paymentMethod && !form.paymentReference.trim()
              const blocked = !form.paymentMethod || lipaIncomplete || mobileIncomplete
              const hint = !form.paymentMethod ? 'Select a payment method'
                         : lipaIncomplete      ? 'Upload receipt or enter reference number'
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
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {isCard ? 'Redirecting…' : 'Submitting…'}</>
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

    </div>
  )
}

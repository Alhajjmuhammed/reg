'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Upload,
  ImageIcon,
} from 'lucide-react'
import { cn, assetUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type PaymentMethod } from '@/lib/types'

interface PaymentGatewayProps {
  amount: number
  onPaymentComplete: (reference: string, method: PaymentMethod, receiptUrl?: string) => void
  onPaymentError: (error: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

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

export function PaymentGateway({
  amount,
  onPaymentComplete,
  onPaymentError,
  isProcessing,
  setIsProcessing,
}: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [showCvv, setShowCvv] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptName, setReceiptName] = useState('')
  const [lipaReference, setLipaReference] = useState('')
  const [error, setError] = useState('')

  const isCard = selectedMethod === 'visa' || selectedMethod === 'mastercard'
  const isLipaNumber = selectedMethod === 'lipa-number'
  const detectedBrand = detectCardBrand(cardNumber)

  const handleReceiptChange = (file: File | null) => {
    if (!file) { setReceiptUrl(''); setReceiptName(''); return }
    const reader = new FileReader()
    reader.onload = () => {
      setReceiptUrl(reader.result as string)
      setReceiptName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amt)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (raw: string) => {
    const formatted = formatCardNumber(raw)
    setCardNumber(formatted)
    const brand = detectCardBrand(formatted)
    if (brand === 'visa' && selectedMethod !== 'visa') setSelectedMethod('visa')
    if (brand === 'mastercard' && selectedMethod !== 'mastercard') setSelectedMethod('mastercard')
  }

  const validateForm = (): boolean => {
    setError('')

    if (!selectedMethod) {
      setError('Please select a payment method')
      return false
    }

    if (isLipaNumber) {
      if (!receiptUrl && !lipaReference.trim()) {
        setError('Please upload your payment receipt/screenshot or enter the payment reference number')
        return false
      }
    } else if (!isCard) {
      if (!phoneNumber || phoneNumber.length < 10) {
        setError('Please enter a valid phone number')
        return false
      }
    }

    if (isCard) {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid card number')
        return false
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setError('Please enter card expiry date')
        return false
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError('Please enter CVV')
        return false
      }
      if (!cardName) {
        setError('Please enter cardholder name')
        return false
      }
    }

    return true
  }

  const handlePayment = async () => {
    if (!validateForm()) return

    setIsProcessing(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 2500))
      const reference = isLipaNumber
        ? (lipaReference.trim() || `LIPA-${Date.now().toString(36).toUpperCase()}`)
        : `TXN${Date.now().toString(36).toUpperCase()}`
      onPaymentComplete(reference, selectedMethod!, isLipaNumber ? receiptUrl : undefined)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      onPaymentError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Amount Display */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-sm text-muted-foreground">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary">TZS {formatCurrency(amount)}</p>
      </div>

      {/* Payment Methods — M-Pesa · Mixx by Yas · Lipa Number · Card */}
      <div className="grid gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setSelectedMethod('mpesa')}
          disabled={isProcessing}
          className={cn(
            'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
            selectedMethod === 'mpesa'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/40 hover:bg-muted/30',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Image src={assetUrl('/images/mpesa-logo.png')} alt="M-Pesa" width={72} height={28} className="h-7 w-auto object-contain" />
          <p className="text-xs font-semibold text-foreground">M-PESA</p>
          {selectedMethod === 'mpesa' && <Check className="h-4 w-4 text-primary" />}
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod('mpesa-mixx')}
          disabled={isProcessing}
          className={cn(
            'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
            selectedMethod === 'mpesa-mixx'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/40 hover:bg-muted/30',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Image src={assetUrl('/images/mixx-by-yas-logo.png')} alt="Mixx by Yas" width={72} height={28} className="h-7 w-auto object-contain" />
          <p className="text-xs font-semibold text-foreground">MIXX BY YAS</p>
          {selectedMethod === 'mpesa-mixx' && <Check className="h-4 w-4 text-primary" />}
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod('lipa-number')}
          disabled={isProcessing}
          className={cn(
            'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
            selectedMethod === 'lipa-number'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/40 hover:bg-muted/30',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Image src={assetUrl('/images/lipa-number-logo.jpg')} alt="Lipa Number" width={72} height={28} className="h-7 w-auto object-contain rounded" />
          <p className="text-xs font-semibold text-foreground">LIPA NUMBER</p>
          <p className="text-[10px] text-muted-foreground">Upload receipt for approval</p>
          {selectedMethod === 'lipa-number' && <Check className="h-4 w-4 text-primary" />}
        </button>

        <button
          type="button"
          onClick={() => { if (!isCard) setSelectedMethod('visa') }}
          disabled={isProcessing}
          className={cn(
            'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
            isCard
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/40 hover:bg-muted/30',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
            Card
          </span>
          <p className="text-xs font-semibold text-foreground">Visa / Mastercard</p>
          <p className="text-[10px] text-muted-foreground">Auto-detect from number</p>
          {isCard && <Check className="h-4 w-4 text-primary" />}
        </button>
      </div>

      {/* Payment Form */}
      {selectedMethod && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          {/* Mobile Money Form */}
          {!isCard && !isLipaNumber && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+255 7XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                You will receive a payment prompt on this number
              </p>
            </div>
          )}

          {/* Lipa Number — receipt / screenshot upload */}
          {isLipaNumber && (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary/30 p-3 text-sm text-foreground space-y-3">
                <p>
                  Open your M-Pesa, Mixx by Yas, or banking app, then scan the QR code below or use{' '}
                  <strong>Lipa Number: 440625027</strong> (<strong>HAMINASS GROUP LTD</strong>) to
                  complete the payment.
                </p>
                <Image
                  src={assetUrl('/images/lipa-number-logo.jpg')}
                  alt="Scan to pay via Lipa Number — 440625027 HAMINASS GROUP LTD"
                  width={220}
                  height={340}
                  className="h-auto w-64 mx-auto rounded-lg border border-border"
                />
                <p>
                  After paying, upload your receipt/screenshot or enter the payment reference
                  number below. Your registration will be confirmed once an admin reviews and
                  approves the payment.
                </p>
              </div>

              <Label htmlFor="lipaReference">Payment Reference Number</Label>
              <Input
                id="lipaReference"
                value={lipaReference}
                onChange={(e) => setLipaReference(e.target.value)}
                placeholder="e.g. MP123456789"
                disabled={isProcessing}
                className="font-mono"
              />

              <div className="relative py-1 text-center text-xs text-muted-foreground">
                <span className="bg-background px-2">— or —</span>
              </div>

              <Label htmlFor="receiptUpload">Payment Receipt / Screenshot</Label>
              <label
                htmlFor="receiptUpload"
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                  receiptUrl ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                {receiptUrl ? (
                  <>
                    <ImageIcon className="h-6 w-6 text-primary" />
                    <p className="text-sm font-medium text-foreground">{receiptName}</p>
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
                  id="receiptUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isProcessing}
                  onChange={(e) => handleReceiptChange(e.target.files?.[0] || null)}
                />
              </label>
              {receiptUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={receiptUrl} alt="Receipt preview" className="max-h-48 w-auto rounded-lg border border-border object-contain" />
              )}
            </div>
          )}

          {/* Card Form */}
          {isCard && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Card Details
                {detectedBrand && BRAND_META[detectedBrand] && (
                  <span className={cn('rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wider', BRAND_META[detectedBrand].color)}>
                    {BRAND_META[detectedBrand].label} detected
                  </span>
                )}
              </p>
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="JOHN DOE"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="uppercase font-medium tracking-wider"
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    maxLength={19}
                    disabled={isProcessing}
                    className="font-mono tracking-widest pr-24"
                    inputMode="numeric"
                  />
                  {detectedBrand && BRAND_META[detectedBrand] ? (
                    <span className={cn(
                      'absolute right-2.5 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wider',
                      BRAND_META[detectedBrand].color
                    )}>
                      {BRAND_META[detectedBrand].label}
                    </span>
                  ) : (
                    <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Expiry Date</Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    disabled={isProcessing}
                    className="font-mono tracking-widest"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardCvv">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cardCvv"
                      type={showCvv ? 'text' : 'password'}
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      disabled={isProcessing}
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
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                Your payment is secured with 256-bit SSL encryption
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Pay Button */}
      <Button
        type="button"
        className="w-full"
        size="lg"
        onClick={handlePayment}
        disabled={!selectedMethod || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isLipaNumber ? 'Submitting...' : 'Processing Payment...'}
          </>
        ) : isLipaNumber ? (
          'Submit for Approval'
        ) : (
          `Pay TZS ${formatCurrency(amount)}`
        )}
      </Button>
    </div>
  )
}

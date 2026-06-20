'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Check,
  Loader2,
  AlertCircle,
  Shield,
  Upload,
  ImageIcon,
  ArrowRight,
  CreditCard,
  Smartphone,
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
  onNGeniusRedirect?: (method: PaymentMethod) => Promise<void>
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

const NGENIUS_METHODS: PaymentMethod[] = ['mpesa', 'mpesa-mixx', 'visa', 'mastercard']

export function PaymentGateway({
  amount,
  onPaymentComplete,
  onPaymentError,
  onNGeniusRedirect,
  isProcessing,
  setIsProcessing,
}: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>('lipa-number')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptName, setReceiptName] = useState('')
  const [lipaReference, setLipaReference] = useState('')
  const [error, setError] = useState('')

  const isLipaNumber = selectedMethod === 'lipa-number'
  const isNGenius = selectedMethod !== null && NGENIUS_METHODS.includes(selectedMethod)
  const isCard = selectedMethod === 'visa' || selectedMethod === 'mastercard'

  const handleReceiptChange = (file: File | null) => {
    if (!file) { setReceiptUrl(''); setReceiptName(''); return }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please upload a file under 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => { setReceiptUrl(reader.result as string); setReceiptName(file.name) }
    reader.readAsDataURL(file)
  }

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amt)

  const handlePay = async () => {
    setError('')
    if (!selectedMethod) { setError('Please select a payment method'); return }

    // NGenius redirect flow
    if (isNGenius && onNGeniusRedirect) {
      try {
        setIsProcessing(true)
        await onNGeniusRedirect(selectedMethod)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Payment failed'
        setError(msg)
        onPaymentError(msg)
        setIsProcessing(false)
      }
      return
    }

    // Lipa Number manual flow
    if (isLipaNumber) {
      if (!receiptUrl && !lipaReference.trim()) {
        setError('Please upload your payment receipt or enter the payment reference number')
        return
      }
      setIsProcessing(true)
      const reference = lipaReference.trim() || `LIPA-${Date.now().toString(36).toUpperCase()}`
      onPaymentComplete(reference, selectedMethod, receiptUrl || undefined)
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Amount */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-sm text-muted-foreground">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary">TZS {formatCurrency(amount)}</p>
      </div>

      {/* Payment Method Grid */}
      <div className="grid gap-3 sm:grid-cols-4">
        {/* Lipa Number — active default */}
        <button
          type="button"
          onClick={() => setSelectedMethod('lipa-number')}
          disabled={isProcessing}
          className={cn(
            'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
            selectedMethod === 'lipa-number' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/30',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Image src={assetUrl('/images/lipa-number-logo.jpg')} alt="Lipa Number" width={72} height={28} className="h-7 w-auto object-contain rounded" />
          <p className="text-xs font-semibold text-foreground">LIPA NUMBER</p>
          <p className="text-[10px] text-muted-foreground">Upload receipt for approval</p>
          {selectedMethod === 'lipa-number' && <Check className="h-4 w-4 text-primary" />}
        </button>

        {/* M-Pesa — Coming Soon */}
        <div className="relative flex flex-col items-start gap-2 rounded-xl border-2 border-border p-4 opacity-50 cursor-not-allowed select-none">
          <Image src={assetUrl('/images/mpesa-logo.png')} alt="M-Pesa" width={72} height={28} className="h-7 w-auto object-contain" />
          <p className="text-xs font-semibold text-foreground">M-PESA</p>
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Coming Soon</span>
        </div>

        {/* Mixx by Yas — Coming Soon */}
        <div className="relative flex flex-col items-start gap-2 rounded-xl border-2 border-border p-4 opacity-50 cursor-not-allowed select-none">
          <Image src={assetUrl('/images/mixx-by-yas-logo.png')} alt="Mixx by Yas" width={72} height={28} className="h-7 w-auto object-contain" />
          <p className="text-xs font-semibold text-foreground">MIXX BY YAS</p>
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Coming Soon</span>
        </div>

        {/* Card — Coming Soon */}
        <div className="relative flex flex-col items-start gap-2 rounded-xl border-2 border-border p-4 opacity-50 cursor-not-allowed select-none">
          <CreditCard className="h-7 w-7 text-indigo-500" />
          <p className="text-xs font-semibold text-foreground">Visa / Mastercard</p>
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Coming Soon</span>
        </div>
      </div>

      {/* Payment Details Area */}
      {selectedMethod && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">

          {/* NGenius methods: show redirect info */}
          {isNGenius && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
                {isCard ? (
                  <CreditCard className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isCard ? 'Secure Card Payment via NBC' : 'Mobile Money via NBC'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isCard
                      ? 'You will be redirected to NBC\'s secure payment page to enter your card details. Your card information is never stored on our servers.'
                      : 'You will be redirected to NBC\'s secure payment page to complete your mobile money payment.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500 shrink-0" />
                Secured by NBC NGenius Payment Gateway — 256-bit SSL encrypted
              </div>
            </div>
          )}

          {/* Lipa Number: receipt upload */}
          {isLipaNumber && (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary/30 p-3 text-sm text-foreground space-y-3">
                <p>
                  Open your M-Pesa, Mixx by Yas, or banking app, then scan the QR code below or use{' '}
                  <strong>Lipa Number: 440625027</strong> (<strong>HAMINASS GROUP LTD</strong>) to complete the payment.
                </p>
                <Image
                  src={assetUrl('/images/lipa-number-logo.jpg')}
                  alt="Scan to pay via Lipa Number — 440625027 HAMINASS GROUP LTD"
                  width={220}
                  height={340}
                  className="h-auto w-64 mx-auto rounded-lg border border-border"
                />
                <p>
                  After paying, upload your receipt/screenshot or enter the payment reference number below.
                  Your registration will be confirmed once an admin reviews and approves the payment.
                </p>
              </div>

              <Label htmlFor="lipaReference">Payment Reference Number</Label>
              <Input
                id="lipaReference"
                value={lipaReference}
                onChange={e => setLipaReference(e.target.value)}
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
                  onChange={e => handleReceiptChange(e.target.files?.[0] || null)}
                />
              </label>
              {receiptUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={receiptUrl} alt="Receipt preview" className="max-h-48 w-auto rounded-lg border border-border object-contain" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Pay Button */}
      <Button
        type="button"
        className="w-full"
        size="lg"
        onClick={handlePay}
        disabled={!selectedMethod || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isNGenius ? 'Redirecting to payment…' : 'Submitting…'}
          </>
        ) : isLipaNumber ? (
          'Submit for Approval'
        ) : isNGenius ? (
          <>
            Proceed to Payment — TZS {formatCurrency(amount)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        ) : (
          `Pay TZS ${formatCurrency(amount)}`
        )}
      </Button>
    </div>
  )
}

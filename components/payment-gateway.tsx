'use client'

import { useState } from 'react'
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  FileText, 
  Check, 
  Loader2,
  AlertCircle,
  Shield,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PAYMENT_METHODS_CONFIG, type PaymentMethod, type PaymentMethodConfig } from '@/lib/types'

interface PaymentGatewayProps {
  amount: number
  onPaymentComplete: (reference: string, method: PaymentMethod) => void
  onPaymentError: (error: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

const methodIcons: Record<string, React.ReactNode> = {
  mpesa: <Smartphone className="h-5 w-5" />,
  tigo: <Smartphone className="h-5 w-5" />,
  airtel: <Smartphone className="h-5 w-5" />,
  halo: <Smartphone className="h-5 w-5" />,
  visa: <CreditCard className="h-5 w-5" />,
  mastercard: <CreditCard className="h-5 w-5" />,
  bank: <Building2 className="h-5 w-5" />,
  invoice: <FileText className="h-5 w-5" />,
}

const methodColors: Record<string, string> = {
  mpesa: 'text-green-500',
  tigo: 'text-blue-500',
  airtel: 'text-red-500',
  halo: 'text-orange-500',
  visa: 'text-blue-600',
  mastercard: 'text-red-600',
  bank: 'text-primary',
  invoice: 'text-primary',
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
  const [error, setError] = useState('')

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

  const validateForm = (): boolean => {
    setError('')
    
    if (!selectedMethod) {
      setError('Please select a payment method')
      return false
    }

    const method = PAYMENT_METHODS_CONFIG.find(m => m.id === selectedMethod)
    if (!method) return false

    if (method.type === 'mobile') {
      if (!phoneNumber || phoneNumber.length < 10) {
        setError('Please enter a valid phone number')
        return false
      }
    }

    if (method.type === 'card') {
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
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // 90% success rate for demo
      const success = Math.random() > 0.1
      
      if (success) {
        const reference = `TXN${Date.now().toString(36).toUpperCase()}`
        onPaymentComplete(reference, selectedMethod!)
      } else {
        throw new Error('Payment declined. Please try again or use a different payment method.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      onPaymentError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const mobilePaymentMethods = PAYMENT_METHODS_CONFIG.filter(m => m.type === 'mobile')
  const cardPaymentMethods = PAYMENT_METHODS_CONFIG.filter(m => m.type === 'card')
  const otherPaymentMethods = PAYMENT_METHODS_CONFIG.filter(m => m.type === 'bank' || m.type === 'invoice')

  const selectedMethodConfig = PAYMENT_METHODS_CONFIG.find(m => m.id === selectedMethod)

  return (
    <div className="space-y-6">
      {/* Amount Display */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-sm text-muted-foreground">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary">TZS {formatCurrency(amount)}</p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {/* Mobile Money */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Smartphone className="h-4 w-4 text-primary" />
            Mobile Money
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {mobilePaymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                disabled={isProcessing}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={methodColors[method.icon]}>
                  {methodIcons[method.icon]}
                </div>
                <span className="text-sm font-medium text-foreground">{method.name}</span>
                {selectedMethod === method.id && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <CreditCard className="h-4 w-4 text-primary" />
            Credit / Debit Cards
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {cardPaymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                disabled={isProcessing}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={methodColors[method.icon]}>
                  {methodIcons[method.icon]}
                </div>
                <span className="text-sm font-medium text-foreground">{method.name}</span>
                {selectedMethod === method.id && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Other Methods */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            Other Payment Options
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {otherPaymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                disabled={isProcessing}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={methodColors[method.icon]}>
                  {methodIcons[method.icon]}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-foreground block">{method.name}</span>
                  <span className="text-xs text-muted-foreground">{method.processingTime}</span>
                </div>
                {selectedMethod === method.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {selectedMethodConfig && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5', methodColors[selectedMethodConfig.icon])}>
              {methodIcons[selectedMethodConfig.icon]}
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedMethodConfig.name}</p>
              <p className="text-sm text-muted-foreground">{selectedMethodConfig.instructions}</p>
              {selectedMethodConfig.accountInfo && (
                <p className="mt-1 text-sm font-mono text-primary">{selectedMethodConfig.accountInfo}</p>
              )}
            </div>
          </div>

          {/* Mobile Money Form */}
          {selectedMethodConfig.type === 'mobile' && (
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

          {/* Card Form */}
          {selectedMethodConfig.type === 'card' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    disabled={isProcessing}
                  />
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardCvv">CVV</Label>
                  <Input
                    id="cardCvv"
                    type="password"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    disabled={isProcessing}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                Your payment is secured with 256-bit SSL encryption
              </div>
            </div>
          )}

          {/* Bank Transfer Instructions */}
          {selectedMethodConfig.type === 'bank' && (
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-sm text-foreground">
                Please transfer <strong>TZS {formatCurrency(amount)}</strong> to the account above and 
                upload your payment slip during registration. Your registration will be confirmed once 
                payment is verified.
              </p>
            </div>
          )}

          {/* Invoice Request */}
          {selectedMethodConfig.type === 'invoice' && (
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-sm text-foreground">
                An invoice for <strong>TZS {formatCurrency(amount)}</strong> will be sent to your 
                email address. Payment terms: Net 7 days.
              </p>
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
            Processing Payment...
          </>
        ) : selectedMethodConfig?.type === 'bank' ? (
          'Confirm Bank Transfer'
        ) : selectedMethodConfig?.type === 'invoice' ? (
          'Request Invoice'
        ) : (
          `Pay TZS ${formatCurrency(amount)}`
        )}
      </Button>
    </div>
  )
}

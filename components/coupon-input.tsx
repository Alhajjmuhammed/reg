'use client'

import { useState } from 'react'
import { Tag, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateCoupon } from '@/lib/store'
import { type PackageType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CouponInputProps {
  packageType: PackageType
  totalAmount: number
  onApplyCoupon: (code: string, discount: number) => void
  onRemoveCoupon: () => void
  appliedCoupon?: string
  appliedDiscount?: number
}

export function CouponInput({
  packageType,
  totalAmount,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
  appliedDiscount,
}: CouponInputProps) {
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code')
      return
    }

    setIsValidating(true)
    setError('')
    setSuccess('')

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    const result = validateCoupon(code.trim(), packageType, totalAmount)

    if (result.valid && result.coupon) {
      setSuccess(result.message)
      onApplyCoupon(result.coupon.code, result.discount)
      setCode('')
    } else {
      setError(result.message)
    }

    setIsValidating(false)
  }

  const handleRemove = () => {
    onRemoveCoupon()
    setSuccess('')
    setError('')
  }

  if (appliedCoupon) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Coupon Applied: <span className="font-mono text-primary">{appliedCoupon}</span>
              </p>
              <p className="text-xs text-green-600">
                You save TZS {formatCurrency(appliedDiscount || 0)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            className={cn(
              'pl-10 font-mono uppercase',
              error && 'border-destructive'
            )}
            disabled={isValidating}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {success && (
        <p className="text-sm text-green-600">{success}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Try: EARLY2024 (10% off), STUDENT25 (25% off for students)
      </p>
    </div>
  )
}

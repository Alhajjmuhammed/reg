'use client'

import { useState, useEffect } from 'react'
import { Users, Minus, Plus, Gift, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { type PackageType } from '@/lib/types'
import { getAllPackages, getGroupPricingTiers, computeGroupPricing } from '@/lib/store'
import type { Package, GroupPricingTier } from '@/lib/types'
import { useStoreReady, useStoreVersion } from '@/components/store-provider'

interface GroupBookingSelectorProps {
  selectedSeats: number
  onSeatsChange: (seats: number) => void
  basePackage: PackageType
  onPackageChange: (pkg: PackageType) => void
}

type PricingResult = ReturnType<typeof computeGroupPricing>

export function GroupBookingSelector({
  selectedSeats,
  onSeatsChange,
  basePackage,
  onPackageChange,
}: GroupBookingSelectorProps) {
  const storeReady = useStoreReady()
  const storeVersion = useStoreVersion()
  const [packages, setPackages] = useState<Package[]>([])
  const [tiers, setTiers] = useState<GroupPricingTier[]>([])
  const [pricing, setPricing] = useState<PricingResult | null>(null)

  useEffect(() => {
    setPackages(getAllPackages().filter(p => p.active))
    setTiers(getGroupPricingTiers())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady, storeVersion])

  useEffect(() => {
    setPricing(computeGroupPricing(selectedSeats, basePackage))
  }, [selectedSeats, basePackage, tiers])

  const basePkg = packages.find(p => p.id === basePackage)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Package Selection for Group */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-3 font-medium text-foreground">Base Package for Group</h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onPackageChange(pkg.id)}
              className={cn(
                'rounded-lg border p-3 text-left transition-all',
                basePackage === pkg.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <p className="text-sm font-medium text-foreground">{pkg.name}</p>
              <p className="text-xs text-muted-foreground">
                TZS {formatCurrency(pkg.price)}/person
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Seat Counter */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Number of Seats</p>
              <p className="text-sm text-muted-foreground">Select 2-10 seats for group discount</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onSeatsChange(Math.max(2, selectedSeats - 1))}
              disabled={selectedSeats <= 2}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-2xl font-bold text-foreground">
              {selectedSeats}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onSeatsChange(Math.min(10, selectedSeats + 1))}
              disabled={selectedSeats >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier, idx) => {
          // Compare against the single tier computeGroupPricing actually selected.
          // Checking seat range overlap causes ALL overlapping tiers to appear active.
          const isActive =
            pricing !== null &&
            pricing.tier !== null &&
            pricing.tier.minSeats === tier.minSeats &&
            pricing.tier.maxSeats === tier.maxSeats
          return (
            <button
              key={`${tier.minSeats}-${tier.maxSeats}-${idx}`}
              type="button"
              onClick={() => onSeatsChange(tier.minSeats)}
              className={cn(
                'relative rounded-lg border p-4 text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              {isActive && (
                <div className="absolute -right-2 -top-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              <p className="text-lg font-bold text-foreground">
                {tier.minSeats === tier.maxSeats ? tier.minSeats : `${tier.minSeats}-${tier.maxSeats}`} Seats
              </p>
              <p className="text-sm text-primary font-medium">{tier.discountPercent}% OFF</p>
              <p className="mt-1 text-xs text-muted-foreground">
                TZS {formatCurrency(tier.perSeatPrice)}/seat
              </p>
            </button>
          )
        })}
      </div>

      {/* Pricing Summary */}
      {selectedSeats >= 2 && pricing?.tier && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Group Booking Summary</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original Price ({selectedSeats} x TZS {formatCurrency(basePkg?.price || 0)})</span>
              <span className="text-muted-foreground line-through">TZS {formatCurrency(pricing!.originalTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Group Discount ({pricing!.tier!.discountPercent}%)</span>
              <span className="text-green-500">-TZS {formatCurrency(pricing!.savings)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-medium text-foreground">Total Price</span>
              <span className="text-xl font-bold text-primary">TZS {formatCurrency(pricing!.totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per seat</span>
              <span className="text-foreground">TZS {formatCurrency(pricing!.perSeatPrice)}</span>
            </div>
          </div>

          {/* Bonuses */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Group Bonuses Included:
            </p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {pricing!.tier!.bonuses.map((bonus, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3 w-3 text-primary shrink-0" />
                  {bonus}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

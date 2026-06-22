'use client'

import { useState, useEffect } from 'react'
import { Check, Gift } from 'lucide-react'
import { getGroupPricingTiers } from '@/lib/store'
import type { GroupPricingTier } from '@/lib/types'
import { useStoreReady, useStoreVersion } from '@/components/store-provider'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount)
}

interface GroupPricingCardsProps {
  initialTiers?: GroupPricingTier[]
}

export function GroupPricingCards({ initialTiers }: GroupPricingCardsProps) {
  const storeReady = useStoreReady()
  const storeVersion = useStoreVersion()
  const [tiers, setTiers] = useState<GroupPricingTier[]>(initialTiers ?? [])

  useEffect(() => {
    if (!storeReady) return
    setTiers(getGroupPricingTiers())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady, storeVersion])

  if (tiers.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiers.map((tier, idx) => (
        <div
          key={`${tier.minSeats}-${tier.maxSeats}-${idx}`}
          className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {tier.minSeats === tier.maxSeats ? tier.minSeats : `${tier.minSeats}–${tier.maxSeats}`}
            </span>
            <span className="rounded-full bg-green-500/10 px-2 py-1 text-sm font-medium text-green-500">
              {tier.discountPercent}% OFF
            </span>
          </div>
          <p className="mb-2 text-sm text-muted-foreground">Seats</p>
          <p className="mb-4 text-lg font-semibold text-primary">
            TZS {formatCurrency(tier.perSeatPrice)}
            <span className="text-sm font-normal text-muted-foreground">/seat</span>
          </p>
          <ul className="space-y-1">
            {tier.bonuses.slice(0, 3).map((bonus, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary shrink-0" />
                {bonus}
              </li>
            ))}
            {tier.bonuses.length > 3 && (
              <li className="text-xs text-primary">+{tier.bonuses.length - 3} more bonuses</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}

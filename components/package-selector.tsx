'use client'

import { useState, useEffect } from 'react'
import { Check, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllPackages } from '@/lib/store'
import type { Package, PackageType } from '@/lib/types'

interface PackageSelectorProps {
  selectedPackage: PackageType
  onSelect: (packageId: PackageType) => void
}

export function PackageSelector({ selectedPackage, onSelect }: PackageSelectorProps) {
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    setPackages(getAllPackages().filter(p => p.active))
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {packages.map((pkg) => {
        const isSelected = selectedPackage === pkg.id
        return (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect(pkg.id)}
            className={cn(
              'relative flex flex-col rounded-lg border-2 p-5 text-left transition-all duration-200',
              'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
              isSelected
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : 'border-border bg-card'
            )}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  <Star className="h-3 w-3" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                {pkg.description && (
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{pkg.description}</p>
                )}
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">
                    {pkg.currency} {formatCurrency(pkg.price)}
                  </span>
                  {pkg.originalPrice && pkg.originalPrice > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(pkg.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30'
                )}
              >
                {isSelected && <Check className="h-4 w-4" />}
              </div>
            </div>

            <ul className="flex-1 space-y-2">
              {pkg.features.filter(f => f.trim()).map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </button>
        )
      })}
    </div>
  )
}

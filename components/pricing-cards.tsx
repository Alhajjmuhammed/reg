'use client'

import { useState, useEffect } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllPackages } from '@/lib/store'
import type { Package } from '@/lib/types'

export function PricingCards() {
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    setPackages(getAllPackages().filter(p => p.active))
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount)

  if (packages.length === 0) return null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className={`relative rounded-lg border p-6 transition-all duration-200 hover:shadow-lg ${
            pkg.popular
              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          {pkg.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most Popular
              </span>
            </div>
          )}
          <h3 className="mb-1 text-xl font-semibold text-foreground">{pkg.name}</h3>
          {pkg.description && (
            <p className="mb-3 text-sm text-muted-foreground">{pkg.description}</p>
          )}
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              {pkg.currency} {formatCurrency(pkg.price)}
            </span>
            {pkg.originalPrice && pkg.originalPrice > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(pkg.originalPrice)}
              </span>
            )}
          </div>
          <ul className="mb-6 space-y-2">
            {pkg.features.filter(f => f.trim()).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button className="w-full" variant={pkg.popular ? 'default' : 'outline'} asChild>
            <a href="#register">
              Select Package <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  )
}

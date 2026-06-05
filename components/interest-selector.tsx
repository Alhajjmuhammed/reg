'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TRAINING_INTERESTS } from '@/lib/types'
import { Check } from 'lucide-react'

interface InterestSelectorProps {
  selectedInterests: string[]
  onChange: (interests: string[]) => void
}

export function InterestSelector({ selectedInterests, onChange }: InterestSelectorProps) {
  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      onChange(selectedInterests.filter((id) => id !== interestId))
    } else {
      onChange([...selectedInterests, interestId])
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TRAINING_INTERESTS.map((interest) => {
        const isSelected = selectedInterests.includes(interest.id)
        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => toggleInterest(interest.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              isSelected
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </div>
            <span className="leading-tight">{interest.label}</span>
          </button>
        )
      })}
    </div>
  )
}

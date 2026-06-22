'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getBookedSeats, getSeatRangeForPackage } from '@/lib/store'
import { useStoreReady, useStoreVersion, useHeavyStoreReady } from '@/components/store-provider'
import type { PackageType } from '@/lib/types'

interface SeatMapProps {
  selectedSeats: number[]
  onSeatSelect: (seats: number[]) => void
  maxSeats: number
  disabled?: boolean
  currentPackage?: PackageType
}

// Order: VIP first (front), Standard, Early Bird (back)
const ZONE_ORDER: PackageType[] = ['corporate-vip', 'standard', 'early-bird']

const ZONE_CONFIG: Record<PackageType, {
  label: string
  rowLabel: string
  dot: string
  available: string
  selected: string
  taken: string
  locked: string
  rowBg: string
}> = {
  'corporate-vip': {
    label: 'Corporate VIP',
    rowLabel: 'VIP',
    dot: 'bg-purple-500',
    available: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-300 dark:hover:bg-purple-600',
    selected: 'bg-purple-500 text-white border border-purple-600 shadow-md shadow-purple-500/30 scale-110',
    taken: 'bg-purple-400/60 text-white border border-purple-400 opacity-50 cursor-not-allowed',
    locked: 'bg-muted/30 border border-dashed border-muted-foreground/20 text-muted-foreground/30 cursor-not-allowed',
    rowBg: 'bg-purple-50/30 dark:bg-purple-950/10',
  },
  'standard': {
    label: 'Standard',
    rowLabel: 'STD',
    dot: 'bg-blue-500',
    available: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-300 dark:hover:bg-blue-600',
    selected: 'bg-blue-500 text-white border border-blue-600 shadow-md shadow-blue-500/30 scale-110',
    taken: 'bg-blue-400/60 text-white border border-blue-400 opacity-50 cursor-not-allowed',
    locked: 'bg-muted/30 border border-dashed border-muted-foreground/20 text-muted-foreground/30 cursor-not-allowed',
    rowBg: 'bg-blue-50/30 dark:bg-blue-950/10',
  },
  'early-bird': {
    label: 'Early Bird',
    rowLabel: 'EB',
    dot: 'bg-amber-500',
    available: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-300 dark:hover:bg-amber-600',
    selected: 'bg-amber-500 text-white border border-amber-600 shadow-md shadow-amber-500/30 scale-110',
    taken: 'bg-amber-400/60 text-white border border-amber-400 opacity-50 cursor-not-allowed',
    locked: 'bg-muted/30 border border-dashed border-muted-foreground/20 text-muted-foreground/30 cursor-not-allowed',
    rowBg: 'bg-amber-50/30 dark:bg-amber-950/10',
  },
}

const SEATS_PER_ROW = 10

export function SeatMap({ selectedSeats, onSeatSelect, maxSeats, disabled, currentPackage }: SeatMapProps) {
  const storeReady = useStoreReady()
  const storeVersion = useStoreVersion()
  const heavyReady = useHeavyStoreReady()
  const [bookedSeats, setBookedSeats] = useState<Map<string, PackageType>>(new Map())
  const [ranges, setRanges] = useState<Record<PackageType, { start: number; end: number }>>({
    'corporate-vip': { start: 1,  end: 20 },
    'standard':      { start: 21, end: 60 },
    'early-bird':    { start: 61, end: 100 },
  })

  // Seat ranges come from the light store (seat config), available on all pages
  useEffect(() => {
    if (!storeReady) return
    setRanges({
      'corporate-vip': getSeatRangeForPackage('corporate-vip'),
      'standard':      getSeatRangeForPackage('standard'),
      'early-bird':    getSeatRangeForPackage('early-bird'),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady, storeVersion])

  // Booked seats come from participant data (heavy store), only loaded in admin
  useEffect(() => {
    if (!heavyReady) return
    setBookedSeats(getBookedSeats())
  }, [heavyReady])

  // Which zone does a seat belong to?
  const getSeatZone = (seatNum: number): PackageType | null => {
    for (const pkg of ZONE_ORDER) {
      const r = ranges[pkg]
      if (seatNum >= r.start && seatNum <= r.end) return pkg
    }
    return null
  }

  const handleSeatClick = (seatNum: number) => {
    if (disabled) return
    if (bookedSeats.has(String(seatNum))) return
    const zone = getSeatZone(seatNum)
    if (!zone) return
    if (currentPackage && currentPackage !== zone) return
    if (selectedSeats.includes(seatNum)) {
      onSeatSelect(selectedSeats.filter(s => s !== seatNum))
    } else if (selectedSeats.length < maxSeats) {
      onSeatSelect([...selectedSeats, seatNum])
    }
  }

  // Build rows in zone order: VIP rows first, then Standard, then Early Bird
  // Each zone may span multiple rows of 10
  const allRows: Array<{ pkg: PackageType; rowIndex: number; seats: number[] }> = []
  let globalRowIndex = 0
  for (const pkg of ZONE_ORDER) {
    const r = ranges[pkg]
    const count = r.end - r.start + 1
    if (count <= 0) continue
    const numRows = Math.ceil(count / SEATS_PER_ROW)
    for (let ri = 0; ri < numRows; ri++) {
      const rowStart = r.start + ri * SEATS_PER_ROW
      const rowEnd = Math.min(rowStart + SEATS_PER_ROW - 1, r.end)
      allRows.push({
        pkg,
        rowIndex: globalRowIndex++,
        seats: Array.from({ length: rowEnd - rowStart + 1 }, (_, i) => rowStart + i),
      })
    }
  }

  // Label a seat relative to its zone row
  const getSeatLabel = (seatNum: number): string => {
    const zone = getSeatZone(seatNum)
    if (!zone) return String(seatNum)
    const posInZone = seatNum - ranges[zone].start
    const rowLetter = String.fromCharCode(65 + Math.floor(posInZone / SEATS_PER_ROW))
    const colNum = (posInZone % SEATS_PER_ROW) + 1
    return `${rowLetter}${colNum}`
  }

  return (
    <div className="space-y-4">
      {/* Stage */}
      <div className="mx-auto w-3/4 rounded-lg bg-gradient-to-b from-primary/20 to-transparent py-3 text-center">
        <span className="text-sm font-semibold text-primary">STAGE / PRESENTATION AREA</span>
      </div>

      {/* Info banner */}
      {currentPackage && (
        <div className={cn(
          'rounded-lg px-4 py-2 text-sm text-center font-medium',
          currentPackage === 'corporate-vip' && 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
          currentPackage === 'standard'      && 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
          currentPackage === 'early-bird'    && 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        )}>
          You selected <strong>{ZONE_CONFIG[currentPackage].label}</strong>{' '}
          &mdash; only <span className="underline">{ZONE_CONFIG[currentPackage].label} seats</span> are selectable.
        </div>
      )}

      {/* Single unified seat grid */}
      <div className="rounded-xl border bg-card p-4 overflow-x-auto">
        <div className="flex flex-col gap-1 min-w-[380px]">
          {allRows.map(({ pkg, rowIndex, seats }) => {
            const cfg = ZONE_CONFIG[pkg]
            // Row letter within its zone
            const rowLetter = String.fromCharCode(65 + rowIndex - (
              pkg === 'corporate-vip' ? 0
              : pkg === 'standard' ? Math.ceil((ranges['corporate-vip'].end - ranges['corporate-vip'].start + 1) / SEATS_PER_ROW)
              : Math.ceil((ranges['corporate-vip'].end - ranges['corporate-vip'].start + 1) / SEATS_PER_ROW) +
                Math.ceil((ranges['standard'].end - ranges['standard'].start + 1) / SEATS_PER_ROW)
            ))

            return (
              <div key={rowIndex} className={cn('flex items-center gap-1 rounded px-1 py-0.5', cfg.rowBg)}>
                {/* Zone indicator */}
                <div className="flex items-center gap-1 w-14 shrink-0">
                  <div className={cn('h-2 w-2 rounded-full shrink-0', cfg.dot)} />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{cfg.rowLabel}</span>
                  <span className="text-[9px] text-muted-foreground">{rowLetter}</span>
                </div>

                {/* Seats */}
                <div className="flex gap-1">
                  {seats.map(seatNum => {
                    const isTaken = bookedSeats.has(String(seatNum))
                    const isSelected = selectedSeats.includes(seatNum)
                    const isMyZone = !currentPackage || currentPackage === pkg
                    const isClickable = isMyZone && !disabled && !isTaken

                    const titleText = isTaken
                      ? `Seat ${seatNum} - booked`
                      : isSelected
                      ? `Seat ${seatNum} - selected (click to remove)`
                      : !isMyZone
                      ? `Seat ${seatNum} - ${cfg.label} only`
                      : `Seat ${seatNum} - click to select`

                    return (
                      <button
                        key={seatNum}
                        type="button"
                        onClick={() => handleSeatClick(seatNum)}
                        disabled={!isClickable}
                        title={titleText}
                        className={cn(
                          'flex h-7 w-9 items-center justify-center rounded text-[10px] font-bold transition-all duration-100',
                          isTaken    && cfg.taken,
                          isSelected && cfg.selected,
                          !isTaken && !isSelected && isClickable  && cfg.available,
                          !isTaken && !isSelected && !isClickable && cfg.locked,
                        )}
                      >
                        {seatNum}
                      </button>
                    )
                  })}
                </div>

                {/* Right label */}
                <span className="text-[9px] text-muted-foreground w-4 text-center">{rowLetter}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        {ZONE_ORDER.map(pkg => {
          const cfg = ZONE_CONFIG[pkg]
          const r = ranges[pkg]
          const total = r.end - r.start + 1
          const taken = Array.from({ length: total }, (_, i) => r.start + i).filter(n => bookedSeats.has(String(n))).length
          return (
            <div key={pkg} className="flex items-center gap-1.5">
              <div className={cn('h-3.5 w-3.5 rounded', cfg.dot)} />
              <span className="text-muted-foreground">
                {cfg.label} <span className="font-medium text-foreground">{total - taken}</span>/{total}
              </span>
            </div>
          )
        })}
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded border-2 border-dashed border-muted-foreground/30" />
          <span className="text-muted-foreground">Locked (other plan)</span>
        </div>
      </div>

      {/* Selection summary */}
      {selectedSeats.length > 0 && (
        <div className={cn(
          'rounded-lg border-2 p-3 text-center',
          currentPackage === 'corporate-vip' && 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20',
          currentPackage === 'standard'      && 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20',
          currentPackage === 'early-bird'    && 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20',
          !currentPackage                    && 'border-primary/30 bg-primary/5',
        )}>
          <p className="text-xs text-muted-foreground mb-1">Your Selected Seats</p>
          <p className={cn(
            'text-lg font-bold',
            currentPackage === 'corporate-vip' && 'text-purple-600 dark:text-purple-400',
            currentPackage === 'standard'      && 'text-blue-600 dark:text-blue-400',
            currentPackage === 'early-bird'    && 'text-amber-600 dark:text-amber-400',
            !currentPackage                    && 'text-primary',
          )}>
            {selectedSeats.sort((a, b) => a - b).join(', ')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedSeats.length} of {maxSeats} seat{maxSeats !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {selectedSeats.length >= maxSeats && maxSeats > 1 && (
        <p className="text-center text-xs text-amber-500 font-medium">
          Maximum {maxSeats} seats selected for your group.
        </p>
      )}
    </div>
  )
}

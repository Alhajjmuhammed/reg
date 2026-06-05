'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getSeatConfiguration } from '@/lib/store'

interface SeatMapProps {
  selectedSeats: number[]
  onSeatSelect: (seats: number[]) => void
  maxSeats: number
  disabled?: boolean
}

export function SeatMap({ selectedSeats, onSeatSelect, maxSeats, disabled }: SeatMapProps) {
  const [takenSeats, setTakenSeats] = useState<Set<number>>(new Set())
  const [seatConfig, setSeatConfig] = useState({ totalSeats: 100, confirmedSeats: 0 })

  useEffect(() => {
    const config = getSeatConfiguration()
    setSeatConfig(config)
    // Simulate some taken seats for demo
    const taken = new Set<number>()
    for (let i = 0; i < config.confirmedSeats; i++) {
      taken.add(Math.floor(Math.random() * config.totalSeats) + 1)
    }
    setTakenSeats(taken)
  }, [])

  const handleSeatClick = (seatNumber: number) => {
    if (disabled || takenSeats.has(seatNumber)) return

    if (selectedSeats.includes(seatNumber)) {
      onSeatSelect(selectedSeats.filter(s => s !== seatNumber))
    } else if (selectedSeats.length < maxSeats) {
      onSeatSelect([...selectedSeats, seatNumber])
    }
  }

  const rows = 10
  const seatsPerRow = 10

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-secondary" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary" />
          <span className="text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted-foreground/30" />
          <span className="text-muted-foreground">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-primary/30 border-2 border-primary" />
          <span className="text-muted-foreground">VIP Row</span>
        </div>
      </div>

      {/* Stage/Screen */}
      <div className="mx-auto w-3/4 rounded-lg bg-gradient-to-b from-primary/20 to-transparent p-3 text-center">
        <span className="text-sm font-medium text-primary">STAGE / PRESENTATION AREA</span>
      </div>

      {/* Seat Grid */}
      <div className="flex flex-col items-center gap-2">
        {Array.from({ length: rows }, (_, rowIndex) => {
          const isVipRow = rowIndex === 0
          return (
            <div key={rowIndex} className="flex items-center gap-2">
              <span className="w-6 text-xs text-muted-foreground">
                {String.fromCharCode(65 + rowIndex)}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: seatsPerRow }, (_, seatIndex) => {
                  const seatNumber = rowIndex * seatsPerRow + seatIndex + 1
                  const isTaken = takenSeats.has(seatNumber)
                  const isSelected = selectedSeats.includes(seatNumber)
                  
                  return (
                    <button
                      key={seatNumber}
                      type="button"
                      onClick={() => handleSeatClick(seatNumber)}
                      disabled={disabled || isTaken}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-all',
                        isTaken && 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed',
                        isSelected && 'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
                        !isTaken && !isSelected && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                        isVipRow && !isTaken && !isSelected && 'border-2 border-primary bg-primary/10',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      title={`Seat ${seatNumber}${isTaken ? ' (Taken)' : ''}`}
                    >
                      {seatIndex + 1}
                    </button>
                  )
                })}
              </div>
              <span className="w-6 text-xs text-muted-foreground">
                {String.fromCharCode(65 + rowIndex)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
          <p className="text-sm text-muted-foreground">Selected Seats</p>
          <p className="text-lg font-bold text-primary">
            {selectedSeats.sort((a, b) => a - b).map(s => {
              const row = String.fromCharCode(65 + Math.floor((s - 1) / seatsPerRow))
              const seat = ((s - 1) % seatsPerRow) + 1
              return `${row}${seat}`
            }).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

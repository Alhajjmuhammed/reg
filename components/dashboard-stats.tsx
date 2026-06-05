'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  CreditCard,
  Smartphone,
  Building2,
  Armchair,
  UserPlus,
} from 'lucide-react'
import { getStatistics } from '@/lib/store'
import { PACKAGES } from '@/lib/types'

interface Stats {
  totalRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  cancelledRegistrations: number
  waitlistCount: number
  totalRevenue: number
  expectedRevenue: number
  paidParticipants: number
  partialPayments: number
  unpaidParticipants: number
  packageDistribution: Record<string, number>
  paymentMethodStats: Record<string, number>
  groupStats: {
    totalGroups: number
    totalGroupSeats: number
    groupRevenue: number
  }
  seatConfiguration: {
    totalSeats: number
    reservedSeats: number
    confirmedSeats: number
    availableSeats: number
    waitlistCount: number
  }
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    setStats(getStatistics())
  }, [])

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-card" />
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Total Registrations',
      value: stats.totalRegistrations,
      icon: Users,
      description: `${stats.confirmedRegistrations} confirmed, ${stats.pendingRegistrations} pending`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Revenue',
      value: `TZS ${formatCurrency(stats.totalRevenue)}`,
      icon: DollarSign,
      description: `Expected: TZS ${formatCurrency(stats.expectedRevenue)}`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Available Seats',
      value: stats.seatConfiguration.availableSeats,
      icon: Armchair,
      description: `${stats.seatConfiguration.confirmedSeats} of ${stats.seatConfiguration.totalSeats} filled`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Payment Status',
      value: `${Math.round((stats.paidParticipants / Math.max(stats.totalRegistrations, 1)) * 100)}%`,
      icon: CreditCard,
      description: `${stats.paidParticipants} paid, ${stats.partialPayments} partial`,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Package Distribution */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Package Distribution</h3>
          </div>
          <div className="space-y-4">
            {PACKAGES.map((pkg) => {
              const count = stats.packageDistribution[pkg.id] || 0
              const percentage =
                stats.totalRegistrations > 0
                  ? Math.round((count / stats.totalRegistrations) * 100)
                  : 0
              return (
                <div key={pkg.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{pkg.name}</span>
                    <span className="font-medium text-foreground">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Payment Methods</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'text-green-500' },
              { key: 'tigopesa', label: 'Tigo Pesa', icon: Smartphone, color: 'text-blue-500' },
              { key: 'airtel', label: 'Airtel Money', icon: Smartphone, color: 'text-red-500' },
              { key: 'card', label: 'Card Payments', icon: CreditCard, color: 'text-purple-500' },
              { key: 'bank', label: 'Bank Transfer', icon: Building2, color: 'text-amber-500' },
            ].map((method) => {
              const count = stats.paymentMethodStats[method.key] || 0
              return (
                <div key={method.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <method.icon className={`h-4 w-4 ${method.color}`} />
                    <span className="text-sm text-muted-foreground">{method.label}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Registration Status */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Registration Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Confirmed</span>
              </div>
              <span className="text-sm font-medium text-foreground">{stats.confirmedRegistrations}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <span className="text-sm font-medium text-foreground">{stats.pendingRegistrations}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Waitlist</span>
              </div>
              <span className="text-sm font-medium text-foreground">{stats.waitlistCount}</span>
            </div>
            
            <div className="mt-4 border-t border-border pt-4">
              <h4 className="mb-2 text-sm font-medium text-foreground">Group Bookings</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-secondary/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.groupStats.totalGroups}</p>
                  <p className="text-xs text-muted-foreground">Groups</p>
                </div>
                <div className="rounded bg-secondary/30 p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.groupStats.totalGroupSeats}</p>
                  <p className="text-xs text-muted-foreground">Group Seats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Availability Bar */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Armchair className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Seat Availability</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {stats.seatConfiguration.availableSeats} of {stats.seatConfiguration.totalSeats} available
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-secondary">
          <div className="flex h-full">
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ 
                width: `${(stats.seatConfiguration.confirmedSeats / stats.seatConfiguration.totalSeats) * 100}%` 
              }}
              title={`Confirmed: ${stats.seatConfiguration.confirmedSeats}`}
            />
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ 
                width: `${(stats.seatConfiguration.reservedSeats / stats.seatConfiguration.totalSeats) * 100}%` 
              }}
              title={`Reserved: ${stats.seatConfiguration.reservedSeats}`}
            />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Confirmed ({stats.seatConfiguration.confirmedSeats})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Reserved ({stats.seatConfiguration.reservedSeats})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <span className="text-muted-foreground">Available ({stats.seatConfiguration.availableSeats})</span>
          </div>
        </div>
      </div>
    </div>
  )
}

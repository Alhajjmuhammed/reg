'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { getStatistics, getAllPackages } from '@/lib/store'
import { useHeavyStoreReady } from '@/components/store-provider'
import type { Package } from '@/lib/types'
import {
  Users, DollarSign, TrendingUp, Package as PackageIcon,
  CreditCard, Smartphone, Building2, BarChart3,
  PieChart, ArrowUpRight, CheckCircle2, Clock, XCircle,
} from 'lucide-react'

type Stats = ReturnType<typeof getStatistics>

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount)
}

function StatCard({ title, value, sub, icon: Icon, color, bg }: {
  title: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{value} <span className="text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const PACKAGE_COLORS = ['bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-rose-500', 'bg-cyan-500']

export default function ReportsPage() {
  const heavyReady = useHeavyStoreReady()
  const [stats, setStats] = useState<Stats | null>(null)
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    if (!heavyReady) return
    setStats(getStatistics())
    setPackages(getAllPackages())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heavyReady])

  if (!stats) {
    return (
      <AdminLayout requiredPermission="reports.view">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </AdminLayout>
    )
  }

  const collectionRate = stats.expectedRevenue > 0
    ? Math.round((stats.totalRevenue / stats.expectedRevenue) * 100)
    : 0

  const packageData = packages.map((p, i) => ({
    name: p.name,
    count: stats.packageDistribution[p.id] || 0,
    revenue: (stats.packageDistribution[p.id] || 0) * p.price,
    color: PACKAGE_COLORS[i % PACKAGE_COLORS.length],
  }))

  const paymentMethods = [
    { label: 'M-Pesa', value: stats.paymentMethodStats.mpesa || 0, color: 'bg-green-500' },
    { label: 'Tigo Pesa', value: stats.paymentMethodStats.tigopesa || 0, color: 'bg-blue-500' },
    { label: 'Airtel Money', value: stats.paymentMethodStats.airtel || 0, color: 'bg-red-500' },
    { label: 'Card (Visa/MC)', value: stats.paymentMethodStats.card || 0, color: 'bg-indigo-500' },
    { label: 'Bank Transfer', value: stats.paymentMethodStats.bank || 0, color: 'bg-slate-500' },
  ]

  const totalPaymentTxns = paymentMethods.reduce((s, m) => s + m.value, 0)

  return (
    <AdminLayout requiredPermission="reports.view">
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Reports & Analytics</h1>
            <p className="mt-1 text-muted-foreground">Comprehensive overview of registrations and revenue</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Live data
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            sub={`${stats.confirmedRegistrations} confirmed · ${stats.pendingRegistrations} pending`}
            icon={Users} color="text-primary" bg="bg-primary/10"
          />
          <StatCard
            title="Total Revenue Collected"
            value={`TZS ${formatCurrency(stats.totalRevenue)}`}
            sub={`${collectionRate}% of TZS ${formatCurrency(stats.expectedRevenue)} expected`}
            icon={DollarSign} color="text-green-500" bg="bg-green-500/10"
          />
          <StatCard
            title="Seats Filled"
            value={`${stats.seatConfiguration.confirmedSeats + stats.seatConfiguration.reservedSeats} / ${stats.seatConfiguration.totalSeats}`}
            sub={`${stats.seatConfiguration.availableSeats} seats remaining`}
            icon={TrendingUp} color="text-blue-500" bg="bg-blue-500/10"
          />
          <StatCard
            title="Group Bookings"
            value={stats.groupStats.totalGroups}
            sub={`${stats.groupStats.totalGroupSeats} seats · TZS ${formatCurrency(stats.groupStats.groupRevenue)}`}
            icon={Building2} color="text-purple-500" bg="bg-purple-500/10"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Registration Status Breakdown */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Registration Status
            </h2>
            <div className="space-y-4">
              <ProgressBar label="Confirmed" value={stats.confirmedRegistrations} total={stats.totalRegistrations} color="bg-green-500" />
              <ProgressBar label="Pending" value={stats.pendingRegistrations} total={stats.totalRegistrations} color="bg-amber-500" />
              <ProgressBar label="Cancelled" value={stats.cancelledRegistrations} total={stats.totalRegistrations} color="bg-red-500" />
              <ProgressBar label="Waitlist" value={stats.waitlistCount} total={stats.totalRegistrations} color="bg-blue-500" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              {[
                { label: 'Confirmed', val: stats.confirmedRegistrations, icon: CheckCircle2, c: 'text-green-500' },
                { label: 'Pending', val: stats.pendingRegistrations, icon: Clock, c: 'text-amber-500' },
                { label: 'Cancelled', val: stats.cancelledRegistrations, icon: XCircle, c: 'text-red-500' },
                { label: 'Waitlist', val: stats.waitlistCount, icon: Users, c: 'text-blue-500' },
              ].map(({ label, val, icon: I, c }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <I className={`h-4 w-4 ${c}`} />
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-semibold text-foreground">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Status
            </h2>
            <div className="space-y-4">
              <ProgressBar label="Fully Paid" value={stats.paidParticipants} total={stats.totalRegistrations} color="bg-green-500" />
              <ProgressBar label="Partial Payment" value={stats.partialPayments} total={stats.totalRegistrations} color="bg-amber-500" />
              <ProgressBar label="Unpaid" value={stats.unpaidParticipants} total={stats.totalRegistrations} color="bg-red-500" />
            </div>
            <div className="mt-5 rounded-lg bg-secondary/50 p-4 border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue Collected</span>
                <span className="font-bold text-green-500">TZS {formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Revenue</span>
                <span className="font-semibold text-foreground">TZS {formatCurrency(stats.expectedRevenue)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-bold text-amber-500">TZS {formatCurrency(stats.expectedRevenue - stats.totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Package Distribution */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <PackageIcon className="h-4 w-4 text-primary" />
              Package Distribution
            </h2>
            <div className="space-y-4">
              {packageData.map(pkg => (
                <ProgressBar
                  key={pkg.name}
                  label={pkg.name}
                  value={pkg.count}
                  total={Math.max(stats.totalRegistrations, 1)}
                  color={pkg.color}
                />
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t border-border pt-4">
              {packageData.map(pkg => (
                <div key={pkg.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${pkg.color}`} />
                    <span className="text-foreground">{pkg.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{pkg.count} registrants</span>
                    <span className="font-semibold text-foreground w-32 text-right">TZS {formatCurrency(pkg.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              Payment Methods Used
            </h2>
            {totalPaymentTxns === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <PieChart className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No completed transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map(m => (
                  <ProgressBar key={m.label} label={m.label} value={m.value} total={totalPaymentTxns} color={m.color} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Seat Overview */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            Seat Capacity Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Seats', value: stats.seatConfiguration.totalSeats, color: 'text-foreground', bg: 'bg-secondary' },
              { label: 'Confirmed', value: stats.seatConfiguration.confirmedSeats, color: 'text-green-500', bg: 'bg-green-500/10' },
              { label: 'Reserved (Pending)', value: stats.seatConfiguration.reservedSeats, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Available', value: stats.seatConfiguration.availableSeats, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-lg ${bg} p-4 text-center`}>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-3 rounded-full bg-secondary overflow-hidden flex">
            <div
              className="bg-green-500 h-full transition-all"
              style={{ width: `${(stats.seatConfiguration.confirmedSeats / stats.seatConfiguration.totalSeats) * 100}%` }}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${(stats.seatConfiguration.reservedSeats / stats.seatConfiguration.totalSeats) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Confirmed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Reserved</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary-foreground/20 inline-block" /> Available</span>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}

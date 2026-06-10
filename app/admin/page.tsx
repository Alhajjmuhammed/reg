import { AdminLayout } from '@/components/admin-layout'
import { DashboardStats } from '@/components/dashboard-stats'
import { ParticipantTable } from '@/components/participant-table'
import Link from 'next/link'
import { Users, Ticket, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Admin Dashboard - Executive Masterclass',
  description: 'Manage participant registrations and view statistics',
}

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Overview of registrations and participant management
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/participants"><Users className="mr-2 h-4 w-4" />Participants</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/coupons"><Ticket className="mr-2 h-4 w-4" />Coupons</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/reports"><BarChart3 className="mr-2 h-4 w-4" />Reports</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <DashboardStats />

        {/* Recent Participants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Participants</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/participants">View all →</Link>
            </Button>
          </div>
          <ParticipantTable />
        </div>
      </div>
    </AdminLayout>
  )
}

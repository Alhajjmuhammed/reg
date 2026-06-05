import { AdminLayout } from '@/components/admin-layout'
import { DashboardStats } from '@/components/dashboard-stats'
import { ParticipantTable } from '@/components/participant-table'
import { CouponManagement } from '@/components/coupon-management'

export const metadata = {
  title: 'Admin Dashboard - Executive Masterclass',
  description: 'Manage participant registrations and view statistics',
}

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of registrations and participant management
          </p>
        </div>

        {/* Statistics */}
        <DashboardStats />

        {/* Participant Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Participants</h2>
          <ParticipantTable />
        </div>

        {/* Coupon Management */}
        <CouponManagement />
      </div>
    </AdminLayout>
  )
}

import { AdminLayout } from '@/components/admin-layout'
import { CouponManagement } from '@/components/coupon-management'

export const metadata = {
  title: 'Coupons - Masterclass Admin',
  description: 'Manage discount coupon codes',
}

export default function CouponsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Coupon Management</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage discount codes for participants
          </p>
        </div>
        <CouponManagement />
      </div>
    </AdminLayout>
  )
}

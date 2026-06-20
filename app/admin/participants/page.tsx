import { AdminLayout } from '@/components/admin-layout'
import { ParticipantTable } from '@/components/participant-table'

export const metadata = {
  title: 'Participants - Masterclass Admin',
  description: 'Manage all registered participants',
}

export default function ParticipantsPage() {
  return (
    <AdminLayout requiredPermission="participants.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Participants</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all registered participants, view details, update status and payment info
          </p>
        </div>
        <ParticipantTable />
      </div>
    </AdminLayout>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getParticipants, deleteParticipant, exportToCSV, getAllPackages, updateParticipant, declineParticipant, getSiteSettings } from '@/lib/store'
import type { Package, Participant, ParticipantStatus, PaymentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ParticipantModal } from './participant-modal'
import { useStoreReady } from '@/components/store-provider'

const ITEMS_PER_PAGE = 10

const statusColors: Record<ParticipantStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  confirmed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  waitlist: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
}

const paymentStatusColors: Record<PaymentStatus, string> = {
  unpaid: 'bg-destructive/10 text-destructive border-destructive/30',
  partial: 'bg-warning/10 text-warning border-warning/30',
  paid: 'bg-success/10 text-success border-success/30',
  refunded: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
}

export function ParticipantTable() {
  const storeReady = useStoreReady()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [packageFilter, setPackageFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const loadParticipants = () => {
    setParticipants(getParticipants())
  }

  useEffect(() => {
    loadParticipants()
    setPackages(getAllPackages())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  const filteredParticipants = useMemo(() => {
    let result = participants

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.phoneNumber.includes(searchQuery) ||
          p.city.toLowerCase().includes(query) ||
          p.country?.toLowerCase().includes(query) ||
          p.organizationName?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }

    if (paymentFilter !== 'all') {
      result = result.filter((p) => p.paymentStatus === paymentFilter)
    }

    if (packageFilter !== 'all') {
      result = result.filter((p) => p.selectedPackage === packageFilter)
    }

    return result
  }, [participants, searchQuery, statusFilter, paymentFilter, packageFilter])

  const totalPages = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE)
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleExport = () => {
    const csv = exportToCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participants-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = () => {
    if (selectedParticipant) {
      deleteParticipant(selectedParticipant.id)
      loadParticipants()
      setIsDeleteDialogOpen(false)
      setSelectedParticipant(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPackageName = (id: string) => {
    return packages.find((p) => p.id === id)?.name || id
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={paymentFilter}
              onValueChange={(value) => {
                setPaymentFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={packageFilter}
              onValueChange={(value) => {
                setPackageFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Participant</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Participant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Package
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Registered
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {paginatedParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No participants found
                  </td>
                </tr>
              ) : (
                paginatedParticipants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="transition-colors hover:bg-secondary/20"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{participant.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {participant.occupation}
                          {participant.organizationName && ` at ${participant.organizationName}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[180px]">{participant.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{participant.phoneNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-foreground">
                        {getPackageName(participant.selectedPackage)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            'inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                            paymentStatusColors[participant.paymentStatus]
                          )}
                        >
                          {participant.paymentStatus}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          TZS {formatCurrency(participant.amountPaid)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                          statusColors[participant.status]
                        )}
                      >
                        {participant.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {format(new Date(participant.registrationDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {participant.paymentStatus !== 'paid' && participant.status !== 'cancelled' && (
                            <>
                              <DropdownMenuItem
                                className="text-green-600 focus:text-green-600"
                                onClick={() => {
                                  updateParticipant(participant.id, {
                                    paymentStatus: 'paid',
                                    amountPaid: participant.totalAmount,
                                    status: 'confirmed',
                                  })
                                  loadParticipants()
                                  // Send approval email (fire-and-forget)
                                  const settings = getSiteSettings()
                                  const pkg = packages.find(p => p.id === participant.selectedPackage)
                                  fetch('/api/email/send', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      type: 'seat_confirmed',
                                      to: participant.email,
                                      name: participant.fullName,
                                      eventName: settings.eventName,
                                      eventDate: settings.eventDate,
                                      eventTime: settings.eventTime,
                                      eventVenue: settings.eventVenue
                                        ? `${settings.eventVenue}, ${settings.eventCity}`
                                        : settings.eventCity,
                                      selectedPackage: pkg?.name ?? participant.selectedPackage,
                                      totalAmount: participant.totalAmount,
                                      paymentMethod: participant.paymentMethod,
                                      receiptNumber: participant.receiptNumber,
                                      seatNumbers: participant.seatNumbers,
                                      currency: 'TZS',
                                      loginUrl: `${window.location.origin}/account/dashboard`,
                                    }),
                                  }).catch(console.error)
                                }}
                              >
                                ✓ Approve Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  declineParticipant(participant.id)
                                  loadParticipants()
                                }}
                              >
                                ✕ Decline
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedParticipant(participant)
                              setIsViewModalOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedParticipant(participant)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedParticipant(participant)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredParticipants.length)} of{' '}
              {filteredParticipants.length} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedParticipant && (
        <ParticipantModal
          participant={selectedParticipant}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setSelectedParticipant(null)
          }}
          onSave={() => {
            loadParticipants()
            setIsViewModalOpen(false)
            setSelectedParticipant(null)
          }}
          mode="view"
        />
      )}

      {/* Edit Modal */}
      {selectedParticipant && (
        <ParticipantModal
          participant={selectedParticipant}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedParticipant(null)
          }}
          onSave={() => {
            loadParticipants()
            setIsEditModalOpen(false)
            setSelectedParticipant(null)
          }}
          mode="edit"
        />
      )}

      {/* Add Modal */}
      <ParticipantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={() => {
          loadParticipants()
          setIsAddModalOpen(false)
        }}
        mode="add"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Participant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedParticipant?.fullName}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

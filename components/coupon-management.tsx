'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Percent,
  DollarSign,
  Calendar,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/store'
import { type CouponCode, type PackageType, PACKAGES } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CouponManagement() {
  const [coupons, setCoupons] = useState<CouponCode[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxUses: '',
    validUntil: '',
    minPurchase: '',
    applicablePackages: [] as PackageType[],
    description: '',
  })

  useEffect(() => {
    setCoupons(getCoupons())
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '',
      validUntil: '',
      minPurchase: '',
      applicablePackages: [],
      description: '',
    })
    setEditingCoupon(null)
  }

  const handleOpenDialog = (coupon?: CouponCode) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        maxUses: coupon.maxUses.toString(),
        validUntil: coupon.validUntil,
        minPurchase: coupon.minPurchase?.toString() || '',
        applicablePackages: coupon.applicablePackages || [],
        description: coupon.description,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    const couponData = {
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: parseInt(formData.discountValue),
      maxUses: parseInt(formData.maxUses),
      validUntil: formData.validUntil,
      minPurchase: formData.minPurchase ? parseInt(formData.minPurchase) : undefined,
      applicablePackages: formData.applicablePackages.length > 0 ? formData.applicablePackages : undefined,
      description: formData.description,
    }

    if (editingCoupon) {
      updateCoupon(editingCoupon.code, couponData)
    } else {
      createCoupon(couponData)
    }

    setCoupons(getCoupons())
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (code: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      deleteCoupon(code)
      setCoupons(getCoupons())
    }
  }

  const togglePackage = (pkgId: PackageType) => {
    setFormData(prev => ({
      ...prev,
      applicablePackages: prev.applicablePackages.includes(pkgId)
        ? prev.applicablePackages.filter(p => p !== pkgId)
        : [...prev.applicablePackages, pkgId]
    }))
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Coupon Management</h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="font-mono uppercase"
                  disabled={!!editingCoupon}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      discountType: value as 'percentage' | 'fixed' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (TZS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discountValue">
                    {formData.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    placeholder={formData.discountType === 'percentage' ? '10' : '50000'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="100"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minPurchase">Minimum Purchase (Optional)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  placeholder="500000"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData(prev => ({ ...prev, minPurchase: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Applicable Packages (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => togglePackage(pkg.id)}
                      className={cn(
                        'rounded-full px-3 py-1 text-sm transition-colors',
                        formData.applicablePackages.includes(pkg.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to apply to all packages
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., 20% Early Bird Discount"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => {
              const isExpired = new Date(coupon.validUntil) < new Date()
              const isExhausted = coupon.usedCount >= coupon.maxUses
              return (
                <TableRow key={coupon.code}>
                  <TableCell>
                    <div>
                      <p className="font-mono font-medium text-foreground">{coupon.code}</p>
                      <p className="text-xs text-muted-foreground">{coupon.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {coupon.discountType === 'percentage' ? (
                        <>
                          <Percent className="h-3 w-3 text-primary" />
                          <span>{coupon.discountValue}%</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-3 w-3 text-primary" />
                          <span>TZS {formatCurrency(coupon.discountValue)}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      isExhausted && 'text-destructive'
                    )}>
                      {coupon.usedCount} / {coupon.maxUses}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className={cn(isExpired && 'text-destructive')}>
                        {format(new Date(coupon.validUntil), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                        <X className="h-3 w-3" />
                        Expired
                      </span>
                    ) : isExhausted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
                        Exhausted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(coupon)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.code)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

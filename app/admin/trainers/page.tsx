'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  getAllTrainers,
  getAllTrainerAccounts,
  createTrainerAccount,
  updateTrainerAccount,
  deleteTrainerAccount,
} from '@/lib/store'
import type { Trainer, TrainerAccount } from '@/lib/types'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [accounts, setAccounts] = useState<TrainerAccount[]>([])
  const [mounted, setMounted] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false)
  const [form, setForm] = useState({ trainerId: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  // Reset password dialog
  const [resetDialog, setResetDialog] = useState(false)
  const [resetTarget, setResetTarget] = useState<TrainerAccount | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    setTrainers(getAllTrainers())
    setAccounts(getAllTrainerAccounts())
  }, [])

  const showSave = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000) }
  const refresh = () => setAccounts(getAllTrainerAccounts())

  const getTrainerName = (id: string) => trainers.find(t => t.id === id)?.name || 'Unknown'
  const accountedTrainerIds = new Set(accounts.map(a => a.trainerId))
  const availableTrainers = trainers.filter(t => !accountedTrainerIds.has(t.id))

  const openCreate = () => {
    setForm({ trainerId: availableTrainers[0]?.id || '', email: '', password: '', confirmPassword: '' })
    setFormError('')
    setCreateDialog(true)
  }

  const submitCreate = () => {
    setFormError('')
    if (!form.trainerId) { setFormError('Please select a trainer profile.'); return }
    if (!form.email.trim()) { setFormError('Email is required.'); return }
    if (!form.password) { setFormError('Password is required.'); return }
    if (form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirmPassword) { setFormError('Passwords do not match.'); return }
    if (accounts.find(a => a.email.toLowerCase() === form.email.toLowerCase())) {
      setFormError('An account with this email already exists.')
      return
    }
    createTrainerAccount(form.trainerId, form.email.trim(), form.password)
    setCreateDialog(false)
    refresh()
    showSave('Trainer account created!')
  }

  const submitReset = () => {
    if (!resetTarget || !newPassword || newPassword.length < 6) return
    updateTrainerAccount(resetTarget.id, { passwordHash: newPassword })
    setResetDialog(false)
    setNewPassword('')
    setResetTarget(null)
    showSave('Password updated!')
  }

  const confirmDelete = (id: string) => {
    deleteTrainerAccount(id)
    setDeleteId(null)
    refresh()
    showSave('Account deleted.')
  }

  if (!mounted) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trainer Accounts</h1>
            <p className="text-sm text-muted-foreground">Create and manage trainer portal access</p>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">{saveMsg}</span>}
            <Button onClick={openCreate} disabled={availableTrainers.length === 0} className="gap-2">
              <Plus className="h-4 w-4" /> Create Account
            </Button>
          </div>
        </div>

        {/* Info */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">How trainer accounts work</p>
              <p className="text-muted-foreground mt-0.5">
                Each trainer account is linked to an existing trainer profile. Trainers log in at{' '}
                <a href="/login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  /login <ExternalLink className="h-3 w-3" />
                </a>{' '}
                and can upload materials, post announcements, view participants, and track attendance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Accounts list */}
        {accounts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-25" />
            <p className="font-medium">No trainer accounts yet</p>
            <p className="text-sm mt-1">Click &ldquo;Create Account&rdquo; to give a trainer portal access.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map(acc => {
              const trainer = trainers.find(t => t.id === acc.trainerId)
              return (
                <Card key={acc.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      {trainer?.photoUrl ? (
                        <img src={trainer.photoUrl} alt={trainer.name} className="h-12 w-12 rounded-full object-cover border shrink-0" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <span className="text-lg font-bold text-primary">{getTrainerName(acc.trainerId)[0]}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{getTrainerName(acc.trainerId)}</p>
                        <p className="text-xs text-muted-foreground truncate">{acc.email}</p>
                        {trainer?.title && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{trainer.title}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                      <div className="flex justify-between">
                        <span>Created</span>
                        <span className="text-foreground">{formatDate(acc.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last login</span>
                        <span className="text-foreground">{acc.lastLogin ? formatDate(acc.lastLogin) : 'Never'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => { setResetTarget(acc); setNewPassword(''); setResetDialog(true) }}
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Reset Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => setDeleteId(acc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Trainer profiles without accounts */}
        {availableTrainers.length > 0 && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-muted-foreground">Trainers without portal access</CardTitle>
              <CardDescription>These trainer profiles don&apos;t have login accounts yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableTrainers.map(t => (
                  <Badge key={t.id} variant="secondary" className="gap-1.5 py-1 px-3">
                    <GraduationCap className="h-3 w-3" />
                    {t.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Account Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Trainer Account</DialogTitle>
            <DialogDescription>Trainer will use these credentials to log in at /login</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Trainer Profile <span className="text-destructive">*</span></Label>
              <Select value={form.trainerId} onValueChange={v => setForm(f => ({ ...f, trainerId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trainer" />
                </SelectTrigger>
                <SelectContent>
                  {availableTrainers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="trainer@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password <span className="text-destructive">*</span></Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
            {formError && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={submitCreate}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>{resetTarget ? `Set a new password for ${getTrainerName(resetTarget.trainerId)}` : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)}>Cancel</Button>
            <Button onClick={submitReset} disabled={newPassword.length < 6}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>This trainer will no longer be able to log in. Their materials and announcements will remain.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && confirmDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

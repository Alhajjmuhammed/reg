'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStoreReady } from '@/components/store-provider'
import {
  getCurrentAdmin,
  getAdminProfile,
  setAdminProfile,
  getAdminCredential,
  updateAdminEmail,
  updateAdminCredential,
  updateSubAdmin,
  getSubAdmins,
} from '@/lib/store'
import { UserCircle, Lock, Mail, User, Check, AlertCircle } from 'lucide-react'

type AlertState = { type: 'success' | 'error'; message: string } | null

export default function AdminProfilePage() {
  return (
    <AdminLayout>
      <ProfileContent />
    </AdminLayout>
  )
}

function ProfileContent() {
  const storeReady = useStoreReady()
  const [session, setSession] = useState<{ email: string; name?: string; isSuperAdmin?: boolean } | null>(null)

  const [name, setName] = useState('')
  const [nameAlert, setNameAlert] = useState<AlertState>(null)
  const [savingName, setSavingName] = useState(false)

  const [email, setEmail] = useState('')
  const [emailAlert, setEmailAlert] = useState<AlertState>(null)
  const [savingEmail, setSavingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordAlert, setPasswordAlert] = useState<AlertState>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!storeReady) return
    const s = getCurrentAdmin()
    if (!s) return
    setSession(s)
    setEmail(s.email)
    const isSup = s.isSuperAdmin !== false
    if (isSup) {
      const profile = getAdminProfile()
      setName(profile.name || '')
    } else {
      setName(s.name || '')
    }
  }, [storeReady])

  const isSuperAdmin = !session || session.isSuperAdmin !== false

  function showAlert(setter: (a: AlertState) => void, type: 'success' | 'error', message: string) {
    setter({ type, message })
    setTimeout(() => setter(null), 4000)
  }

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { showAlert(setNameAlert, 'error', 'Name cannot be empty'); return }
    setSavingName(true)
    try {
      if (isSuperAdmin) {
        setAdminProfile({ name: name.trim() })
      } else {
        const users = getSubAdmins()
        const user = users.find(u => u.email.toLowerCase() === session?.email.toLowerCase())
        if (user) updateSubAdmin(user.id, { name: name.trim() })
      }
      showAlert(setNameAlert, 'success', 'Name updated successfully')
    } catch {
      showAlert(setNameAlert, 'error', 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) { showAlert(setEmailAlert, 'error', 'Enter a valid email address'); return }
    setSavingEmail(true)
    try {
      updateAdminEmail(email.trim().toLowerCase())
      showAlert(setEmailAlert, 'success', 'Email updated. Redirecting to login…')
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } catch {
      showAlert(setEmailAlert, 'error', 'Failed to update email')
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) { showAlert(setPasswordAlert, 'error', 'Enter your current password'); return }
    if (newPassword.length < 8) { showAlert(setPasswordAlert, 'error', 'New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { showAlert(setPasswordAlert, 'error', 'Passwords do not match'); return }
    setSavingPassword(true)
    try {
      const { hashPassword } = await import('@/lib/crypto')
      const hashedCurrent = hashPassword(currentPassword)

      if (isSuperAdmin) {
        const cred = getAdminCredential()
        if (cred.passwordHash !== hashedCurrent) {
          showAlert(setPasswordAlert, 'error', 'Current password is incorrect')
          return
        }
        updateAdminCredential(cred.email, newPassword)
      } else {
        const users = getSubAdmins()
        const user = users.find(u => u.email.toLowerCase() === session?.email.toLowerCase())
        if (!user) { showAlert(setPasswordAlert, 'error', 'Account not found'); return }
        if (user.passwordHash !== hashedCurrent) {
          showAlert(setPasswordAlert, 'error', 'Current password is incorrect')
          return
        }
        updateSubAdmin(user.id, { password: newPassword })
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showAlert(setPasswordAlert, 'success', 'Password changed successfully')
    } catch {
      showAlert(setPasswordAlert, 'error', 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <UserCircle className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account details and security</p>
        </div>
      </div>

      {/* Name */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Display Name</h2>
        </div>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your display name"
              maxLength={80}
            />
          </div>
          {nameAlert && <AlertBox alert={nameAlert} />}
          <Button type="submit" disabled={savingName}>
            {savingName ? 'Saving…' : 'Save Name'}
          </Button>
        </form>
      </section>

      {/* Email — super admin only */}
      {isSuperAdmin && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Login Email</h2>
          </div>
          <form onSubmit={handleSaveEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <p className="text-xs text-muted-foreground">You will be logged out after changing email.</p>
            </div>
            {emailAlert && <AlertBox alert={emailAlert} />}
            <Button type="submit" disabled={savingEmail}>
              {savingEmail ? 'Saving…' : 'Save Email'}
            </Button>
          </form>
        </section>
      )}

      {/* Password */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Change Password</h2>
        </div>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          {passwordAlert && <AlertBox alert={passwordAlert} />}
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? 'Saving…' : 'Change Password'}
          </Button>
        </form>
      </section>
    </div>
  )
}

function AlertBox({ alert }: { alert: { type: 'success' | 'error'; message: string } }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
      alert.type === 'success'
        ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
        : 'bg-destructive/10 text-destructive'
    }`}>
      {alert.type === 'success'
        ? <Check className="h-4 w-4 shrink-0" />
        : <AlertCircle className="h-4 w-4 shrink-0" />
      }
      {alert.message}
    </div>
  )
}

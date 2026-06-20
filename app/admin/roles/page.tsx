'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStoreReady } from '@/components/store-provider'
import {
  getAdminRoles,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  getSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  flushSubAdmins,
} from '@/lib/store'
import { ADMIN_PERMISSIONS } from '@/lib/types'
import type { AdminRole, SubAdminUser, PermissionKey } from '@/lib/types'
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Users,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const ROLE_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#4f46e5',
]

const PERMISSION_CATEGORIES = [...new Set(ADMIN_PERMISSIONS.map(p => p.category))]

type Tab = 'roles' | 'users'
type AlertState = { type: 'success' | 'error'; message: string } | null

export default function RolesPage() {
  return (
    <AdminLayout>
      <RolesContent />
    </AdminLayout>
  )
}

function RolesContent() {
  const storeReady = useStoreReady()
  const [tab, setTab] = useState<Tab>('roles')
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [users, setUsers] = useState<SubAdminUser[]>([])

  const reload = useCallback(() => {
    setRoles(getAdminRoles())
    setUsers(getSubAdmins())
  }, [])

  useEffect(() => {
    if (!storeReady) return
    reload()
  }, [storeReady, reload])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles &amp; Permissions</h1>
          <p className="text-sm text-muted-foreground">Create roles, assign permissions, and manage admin users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {(['roles', 'users'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'roles' ? 'Roles' : 'Admin Users'}
          </button>
        ))}
      </div>

      {tab === 'roles' && (
        <RolesTab roles={roles} onReload={reload} />
      )}
      {tab === 'users' && (
        <UsersTab users={users} roles={roles} onReload={reload} />
      )}
    </div>
  )
}

// ==================== ROLES TAB ====================

function RolesTab({ roles, onReload }: { roles: AdminRole[]; onReload: () => void }) {
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [alert, setAlert] = useState<AlertState>(null)

  function showAlert(type: 'success' | 'error', message: string) {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  function handleEdit(role: AdminRole) {
    setEditingRole(role)
    setShowForm(true)
  }

  function handleNew() {
    setEditingRole(null)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    const ok = deleteAdminRole(id)
    if (ok) {
      showAlert('success', 'Role deleted')
      setDeleteConfirm(null)
      onReload()
    } else {
      showAlert('error', 'Cannot delete system roles')
    }
  }

  function handleSave(data: Omit<AdminRole, 'id' | 'createdAt'>, id?: string) {
    if (id) {
      updateAdminRole(id, { name: data.name, description: data.description, color: data.color, permissions: data.permissions })
      showAlert('success', 'Role updated')
    } else {
      createAdminRole(data)
      showAlert('success', 'Role created')
    }
    setShowForm(false)
    setEditingRole(null)
    onReload()
  }

  return (
    <div className="space-y-4">
      {alert && <AlertBox alert={alert} />}

      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Role
        </Button>
      </div>

      {showForm && (
        <RoleForm
          role={editingRole}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingRole(null) }}
        />
      )}

      <div className="grid gap-4">
        {roles.map(role => (
          <div key={role.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: role.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{role.name}</h3>
                    {role.isSystem && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">System</span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </div>
              </div>
              {!role.isSystem && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(role)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {deleteConfirm === role.id ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(role.id)}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(role.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Permissions summary */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.permissions.length === ADMIN_PERMISSIONS.length ? (
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                  All Permissions
                </span>
              ) : role.permissions.length === 0 ? (
                <span className="text-xs text-muted-foreground">No permissions assigned</span>
              ) : (
                role.permissions.map(p => {
                  const def = ADMIN_PERMISSIONS.find(x => x.key === p)
                  return def ? (
                    <span key={p} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/70">
                      {def.label}
                    </span>
                  ) : null
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoleForm({
  role,
  onSave,
  onCancel,
}: {
  role: AdminRole | null
  onSave: (data: Omit<AdminRole, 'id' | 'createdAt'>, id?: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [color, setColor] = useState(role?.color ?? ROLE_COLORS[0])
  const [permissions, setPermissions] = useState<PermissionKey[]>(role?.permissions ?? [])
  const [expandedCats, setExpandedCats] = useState<string[]>(PERMISSION_CATEGORIES)

  function togglePermission(key: PermissionKey) {
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function toggleCategory(cat: string) {
    const catKeys = ADMIN_PERMISSIONS.filter(p => p.category === cat).map(p => p.key)
    const allChecked = catKeys.every(k => permissions.includes(k))
    if (allChecked) {
      setPermissions(prev => prev.filter(k => !catKeys.includes(k)))
    } else {
      setPermissions(prev => [...new Set([...prev, ...catKeys])])
    }
  }

  function toggleExpandCat(cat: string) {
    setExpandedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim(), color, permissions, isSystem: false }, role?.id)
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{role ? 'Edit Role' : 'Create New Role'}</h2>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Role Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Content Manager" required maxLength={50} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" maxLength={120} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {ROLE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#000' : 'transparent',
                  outline: color === c ? '2px solid #fff' : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Permissions</Label>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => {
                const all = ADMIN_PERMISSIONS.map(p => p.key)
                const allSelected = all.every(k => permissions.includes(k))
                setPermissions(allSelected ? [] : [...all])
              }}
            >
              {ADMIN_PERMISSIONS.every(p => permissions.includes(p.key)) ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-2">
            {PERMISSION_CATEGORIES.map(cat => {
              const catPerms = ADMIN_PERMISSIONS.filter(p => p.category === cat)
              const checkedCount = catPerms.filter(p => permissions.includes(p.key)).length
              const allChecked = checkedCount === catPerms.length
              const expanded = expandedCats.includes(cat)

              return (
                <div key={cat} className="rounded-lg border border-border">
                  <div
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                    onClick={() => toggleExpandCat(cat)}
                  >
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={() => toggleCategory(cat)}
                      onClick={e => e.stopPropagation()}
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                    <span className="flex-1 text-sm font-medium text-foreground">{cat}</span>
                    <span className="text-xs text-muted-foreground">{checkedCount}/{catPerms.length}</span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {expanded && (
                    <div className="border-t border-border px-3 py-2 space-y-2">
                      {catPerms.map(perm => (
                        <label key={perm.key} className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={permissions.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                          <span className="text-sm text-foreground/80">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">{permissions.length} of {ADMIN_PERMISSIONS.length} permissions selected</p>
        </div>

        <div className="flex gap-3">
          <Button type="submit">{role ? 'Save Changes' : 'Create Role'}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}

// ==================== USERS TAB ====================

function UsersTab({ users, roles, onReload }: { users: SubAdminUser[]; roles: AdminRole[]; onReload: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<SubAdminUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [alert, setAlert] = useState<AlertState>(null)

  function showAlert(type: 'success' | 'error', message: string) {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  async function handleSave(data: { name: string; email: string; password: string; roleId: string }, id?: string) {
    if (id) {
      const update: Parameters<typeof updateSubAdmin>[1] = { name: data.name, email: data.email, roleId: data.roleId }
      if (data.password) update.password = data.password
      updateSubAdmin(id, update)
    } else {
      const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase())
      if (existing) { showAlert('error', 'Email already in use'); return }
      createSubAdmin(data)
    }
    // Await the Supabase write so data is persisted before the admin logs out
    await flushSubAdmins()
    showAlert('success', id ? 'Admin user updated' : 'Admin user created')
    setShowForm(false)
    setEditingUser(null)
    onReload()
  }

  async function handleToggleActive(user: SubAdminUser) {
    updateSubAdmin(user.id, { active: !user.active })
    await flushSubAdmins()
    onReload()
  }

  async function handleDelete(id: string) {
    deleteSubAdmin(id)
    await flushSubAdmins()
    setDeleteConfirm(null)
    showAlert('success', 'Admin user deleted')
    onReload()
  }

  const nonSystemRoles = roles.filter(r => !r.isSystem)

  return (
    <div className="space-y-4">
      {alert && <AlertBox alert={alert} />}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} admin user{users.length !== 1 ? 's' : ''}</p>
        <Button onClick={() => { setEditingUser(null); setShowForm(true) }} disabled={nonSystemRoles.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      {nonSystemRoles.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-400">
          Create at least one role before adding admin users.
        </div>
      )}

      {showForm && (
        <UserForm
          user={editingUser}
          roles={roles.filter(r => !r.isSystem)}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingUser(null) }}
        />
      )}

      <div className="space-y-3">
        {users.map(user => {
          const role = roles.find(r => r.id === user.roleId)
          return (
            <div key={user.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  {!user.active && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {role && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color }} />
                    <span className="text-xs text-muted-foreground">{role.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleToggleActive(user)} title={user.active ? 'Deactivate' : 'Activate'}>
                  {user.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingUser(user); setShowForm(true) }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {deleteConfirm === user.id ? (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>Delete</Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(user.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No admin users yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create roles first, then add users</p>
          </div>
        )}
      </div>
    </div>
  )
}

function UserForm({
  user,
  roles,
  onSave,
  onCancel,
}: {
  user: SubAdminUser | null
  roles: AdminRole[]
  onSave: (data: { name: string; email: string; password: string; roleId: string }, id?: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(user?.roleId ?? (roles[0]?.id ?? ''))
  const [showPass, setShowPass] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user && password.length < 8) return
    onSave({ name: name.trim(), email: email.trim(), password, roleId }, user?.id)
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{user ? 'Edit Admin User' : 'Add Admin User'}</h2>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{user ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={user ? 'Leave blank to keep current' : 'Minimum 8 characters'}
              minLength={user ? undefined : 8}
              required={!user}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Role *</Label>
          <select
            value={roleId}
            onChange={e => setRoleId(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <Button type="submit">{user ? 'Save Changes' : 'Create User'}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
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

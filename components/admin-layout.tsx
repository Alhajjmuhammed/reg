'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { logoutAll, getCurrentAdmin, getAdminRoles, loadHeavyKeys } from '@/lib/store'
import { useStoreReady, HeavyReadyContext } from '@/components/store-provider'
import type { AdminSession, PermissionKey } from '@/lib/types'
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  FolderOpen,
  Handshake,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Bell,
  Ticket,
  GraduationCap,
  ScrollText,
  ShieldCheck,
  ShieldX,
  UserCircle,
  BookOpen,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

interface AdminLayoutProps {
  children: React.ReactNode
  requiredPermission?: PermissionKey
}

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  permission?: PermissionKey
}

const ALL_NAV: NavItem[] = [
  { name: 'Dashboard',    href: '/admin',              icon: LayoutDashboard },
  { name: 'Participants', href: '/admin/participants',  icon: Users,          permission: 'participants.view' },
  { name: 'Coupons',      href: '/admin/coupons',       icon: Ticket,         permission: 'coupons.manage' },
  { name: 'Reports',      href: '/admin/reports',       icon: FileText,       permission: 'reports.view' },
  { name: 'Documents',    href: '/admin/documents',     icon: FolderOpen,     permission: 'documents.manage' },
  { name: 'Sponsorship',  href: '/admin/sponsorship',   icon: Handshake,      permission: 'sponsorship.view' },
  { name: 'Trainers',     href: '/admin/trainers',      icon: GraduationCap,  permission: 'trainers.manage' },
  { name: 'Curriculum',   href: '/admin/curriculum',    icon: BookOpen,       permission: 'settings.manage' },
  { name: 'Terms',        href: '/admin/terms',         icon: ScrollText,     permission: 'terms.manage' },
  { name: 'Roles',        href: '/admin/roles',         icon: ShieldCheck,    permission: 'roles.manage' },
  { name: 'Settings',     href: '/admin/settings',      icon: Settings,       permission: 'settings.manage' },
]

export function AdminLayout({ children, requiredPermission }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [session, setSession] = useState<AdminSession | null>(null)
  const [heavyReady, setHeavyReady] = useState(false)
  const [heavyLoadFailed, setHeavyLoadFailed] = useState(false)
  const storeReady = useStoreReady()

  // Populate session from localStorage on first mount (synchronous read, no Supabase needed).
  // Runs before the storeReady effect so the sidebar name/nav are correct on first paint.
  useEffect(() => {
    const s = getCurrentAdmin()
    if (s) setSession(s)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Wait for light store before checking session and loading heavy data.
    // This ensures light keys (packages, settings) are in memStore before
    // heavyReady fires, so dashboard stats and reports read correct package data.
    if (!storeReady) return
    const s = getCurrentAdmin()
    if (!s) {
      window.location.href = '/login'
      return
    }
    setSession(s)
    setHeavyReady(false)
    // Retry once if the first attempt fails (network hiccup on VPS)
    loadHeavyKeys().then(ok => {
      if (ok) {
        setHeavyReady(true)
      } else {
        setTimeout(() => {
          loadHeavyKeys().then(ok2 => {
            setHeavyReady(true)
            if (!ok2) setHeavyLoadFailed(true)
          }).catch(() => {
            setHeavyReady(true)
            setHeavyLoadFailed(true)
          })
        }, 1500)
      }
    })
  }, [storeReady])

  const isSuperAdmin = !session || session.isSuperAdmin !== false

  // Recompute roles only when the store refreshes, not on every render.
  const adminRoles = useMemo(() => getAdminRoles(), [storeReady])

  const navigation = useMemo<NavItem[]>(() => {
    return ALL_NAV.filter(item => {
      if (!item.permission) return true
      if (isSuperAdmin) return true
      const role = adminRoles.find(r => r.id === session?.roleId)
      return role ? role.permissions.includes(item.permission) : false
    })
  }, [isSuperAdmin, session?.roleId, adminRoles])

  const hasPermission = useMemo(() => {
    if (!storeReady || !session) return true // loading spinner or login redirect handles this
    if (isSuperAdmin || !requiredPermission) return true
    const role = adminRoles.find(r => r.id === session.roleId)
    return role ? role.permissions.includes(requiredPermission) : false
  }, [storeReady, session, isSuperAdmin, requiredPermission, adminRoles])

  const displayName = session?.name || 'Admin'
  const displayEmail = session?.email || ''
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  return (
    <HeavyReadyContext.Provider value={heavyReady}>
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <img src="/images/logo.png" alt="eOpsprimax" className="h-8 w-auto object-contain" />
          <span className="text-xs text-muted-foreground">Admin Portal</span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              <span className="text-sm font-medium">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-lg sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-foreground" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
            </Button>

            <Link
              href="/"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              View Registration Page
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-medium">{initials}</span>
                  </div>
                  <span className="hidden text-sm font-medium sm:block">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { logoutAll(); window.location.href = '/login' }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {!storeReady ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading data…</p>
              </div>
            </div>
          ) : !hasPermission ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                You don&apos;t have permission to view this page. Ask your administrator to update your role.
              </p>
              <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <>
              {heavyLoadFailed && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Data failed to load.{' '}
                  <button
                    onClick={() => window.location.reload()}
                    className="font-medium underline"
                  >
                    Refresh the page
                  </button>{' '}
                  to try again.
                </div>
              )}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
    </HeavyReadyContext.Provider>
  )
}

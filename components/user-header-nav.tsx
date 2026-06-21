'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, LogOut, ShieldCheck, GraduationCap } from 'lucide-react'
import { getCurrentRole, logoutAll } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const ROLE_DASHBOARD = {
  admin: '/admin',
  trainer: '/trainer/dashboard',
  participant: '/account/dashboard',
} as const

const ROLE_ICON = {
  admin: ShieldCheck,
  trainer: GraduationCap,
  participant: User,
} as const

const ROLE_LABEL = {
  admin: 'Admin Portal',
  trainer: 'Trainer Dashboard',
  participant: 'My Dashboard',
} as const

export function UserHeaderNav() {
  const [session, setSession] = useState<{ role: 'admin' | 'trainer' | 'participant'; email: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const current = getCurrentRole()
    if (current) setSession({ role: current.role, email: current.email })
  }, [])

  if (!mounted) {
    return <div className="h-8 w-24 rounded bg-muted/40 animate-pulse" />
  }

  if (session) {
    const Icon = ROLE_ICON[session.role]
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-2">
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline max-w-[100px] truncate">{session.email.split('@')[0]}</span>
            <span className="sr-only">Account menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-foreground">{session.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{session.role}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={ROLE_DASHBOARD[session.role]} className="cursor-pointer">
              {ROLE_LABEL[session.role]}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => {
              logoutAll()
              setSession(null)
              window.location.href = '/login'
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Link
      href="/login"
      className="hidden rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 sm:inline-flex"
    >
      Login
    </Link>
  )
}


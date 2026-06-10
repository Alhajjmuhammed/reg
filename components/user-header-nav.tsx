'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, LogOut } from 'lucide-react'
import { getCurrentUser, logoutUser } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserHeaderNav() {
  const [userName, setUserName] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const user = getCurrentUser()
    if (user) setUserName(user.email)
  }, [])

  if (!mounted) {
    // Placeholder to avoid layout shift
    return <div className="h-8 w-24 rounded bg-muted/40 animate-pulse" />
  }

  if (userName) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-2">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline max-w-[100px] truncate">{userName.split('@')[0]}</span>
            <span className="sr-only">Account menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/account/dashboard" className="cursor-pointer">
              My Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => {
              logoutUser()
              setUserName(null)
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
      href="/account/login"
      className="hidden rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 sm:inline-flex"
    >
      Login
    </Link>
  )
}

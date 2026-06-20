'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserHeaderNav } from '@/components/user-header-nav'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Curriculum', href: '/#curriculum' },
  { label: 'Trainers', href: '/#trainers' },
  { label: 'Group Discounts', href: '/#group' },
  { label: 'Sponsorship', href: '/sponsorship' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="eOpsprimax" style={{ height: 36 }} className="w-auto max-w-none object-contain" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const basePath = link.href.split('#')[0]
            const isActive =
              basePath === '/'
                ? pathname === '/'
                : pathname.startsWith(basePath)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors hover:text-foreground',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserHeaderNav />
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/#register">Register Now</Link>
          </Button>
          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => {
              const basePath = link.href.split('#')[0]
              const isActive =
                basePath === '/'
                  ? pathname === '/'
                  : pathname.startsWith(basePath)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="mt-2 pt-2 border-t border-border">
              <Button size="sm" asChild className="w-full">
                <Link href="/#register" onClick={() => setMobileOpen(false)}>Register Now</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

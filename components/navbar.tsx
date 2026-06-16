'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserHeaderNav } from '@/components/user-header-nav'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Curriculum', href: '/#curriculum' },
  { label: 'Trainers', href: '/#trainers' },
  { label: 'Group Discounts', href: '/#group' },
  { label: 'Sponsorship', href: '/sponsorship' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="eOpsprimax" style={{ height: 36 }} className="w-auto max-w-none object-contain" />
        </Link>

        {/* Nav Links */}
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
                  isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserHeaderNav />
          <Button size="sm" asChild>
            <Link href="/#register">Register Now</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

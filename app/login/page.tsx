'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft, ShieldCheck, GraduationCap, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { loginUnified, getCurrentRole } from '@/lib/store'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const ROLE_DESTINATIONS = {
  admin: '/admin',
  trainer: '/trainer/dashboard',
  participant: '/account/dashboard',
} as const

const ROLE_INFO = [
  { role: 'admin', icon: ShieldCheck, label: 'Admin', color: 'text-red-500', bg: 'bg-red-500/10' },
  { role: 'trainer', icon: GraduationCap, label: 'Trainer', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { role: 'participant', icon: User, label: 'Participant', color: 'text-green-500', bg: 'bg-green-500/10' },
] as const

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const redirectTo = searchParams.get('redirect') || null

  useEffect(() => {
    setMounted(true)
    const current = getCurrentRole()
    if (current) {
      router.replace(redirectTo || ROLE_DESTINATIONS[current.role])
    }
  }, [router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const result = loginUnified(email.trim(), password)
    setIsLoading(false)

    if (!result) {
      setError('Invalid email or password. Please try again.')
      return
    }

    router.push(redirectTo || ROLE_DESTINATIONS[result.role])
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="eOpsprimax" style={{ height: 32 }} className="w-auto object-contain" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in — we&apos;ll take you to the right place</p>
          </div>

          {/* Role indicators */}
          <div className="grid grid-cols-3 gap-2">
            {ROLE_INFO.map(({ role, icon: Icon, label, color, bg }) => (
              <div key={role} className={cn('flex flex-col items-center gap-1.5 rounded-xl border p-3', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg">Sign In</CardTitle>
              <CardDescription>One login for all portals</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-5 space-y-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-xs">Portal access:</p>
                <p>• <span className="font-medium">Admin</span> — use your admin credentials</p>
                <p>• <span className="font-medium">Trainer</span> — account created by admin</p>
                <p>• <span className="font-medium">Participant</span> — registered with your email</p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

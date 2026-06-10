'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Star,
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MessageCircle,
  ArrowRight,
  Building2,
  Globe,
  Handshake,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserHeaderNav } from '@/components/user-header-nav'
import { getSponsorshipTiers, getSponsors, getSponsorshipSettings } from '@/lib/store'
import type { SponsorshipTier, Sponsor, SponsorshipPageSettings } from '@/lib/types'
import { cn } from '@/lib/utils'

const TIER_STYLES: Record<string, {
  gradient: string
  border: string
  badge: string
  check: string
  price: string
  ring: string
}> = {
  platinum: {
    gradient: 'from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-background',
    border: 'border-slate-300 dark:border-slate-600',
    badge: 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900',
    check: 'text-slate-600 dark:text-slate-300',
    price: 'text-slate-700 dark:text-slate-200',
    ring: 'ring-2 ring-slate-400 dark:ring-slate-500',
  },
  gold: {
    gradient: 'from-yellow-50 via-amber-50 to-white dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-background',
    border: 'border-yellow-300 dark:border-yellow-700',
    badge: 'bg-yellow-500 text-white',
    check: 'text-yellow-600 dark:text-yellow-400',
    price: 'text-yellow-700 dark:text-yellow-300',
    ring: 'ring-2 ring-yellow-400 dark:ring-yellow-600',
  },
  silver: {
    gradient: 'from-gray-50 via-slate-50 to-white dark:from-gray-900/40 dark:via-slate-900/30 dark:to-background',
    border: 'border-gray-300 dark:border-gray-600',
    badge: 'bg-gray-500 text-white',
    check: 'text-gray-500 dark:text-gray-400',
    price: 'text-gray-700 dark:text-gray-300',
    ring: '',
  },
  bronze: {
    gradient: 'from-orange-50 via-amber-50 to-white dark:from-orange-950/30 dark:via-amber-950/20 dark:to-background',
    border: 'border-orange-300 dark:border-orange-700',
    badge: 'bg-orange-600 text-white',
    check: 'text-orange-500 dark:text-orange-400',
    price: 'text-orange-700 dark:text-orange-300',
    ring: '',
  },
  custom: {
    gradient: 'from-primary/5 to-background',
    border: 'border-primary/40',
    badge: 'bg-primary text-primary-foreground',
    check: 'text-primary',
    price: 'text-primary',
    ring: '',
  },
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-TZ', {
    style: currency === 'TZS' ? 'decimal' : 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount) + (currency === 'TZS' ? ' TZS' : '')
}

export default function SponsorshipPage() {
  const [tiers, setTiers] = useState<SponsorshipTier[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [settings, setSettings] = useState<SponsorshipPageSettings | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTiers(getSponsorshipTiers())
    setSponsors(getSponsors())
    setSettings(getSponsorshipSettings())
  }, [])

  if (!mounted || !settings) return null

  const whatsappUrl = `https://wa.me/${settings.contactWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I am interested in sponsoring the Executive Masterclass event. Please send me more information.')}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Executive Masterclass</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/#packages" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Packages</Link>
            <Link href="/sponsorship" className="text-sm text-primary font-medium">Sponsorship</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserHeaderNav />
            <Button size="sm" asChild>
              <Link href="/#register">Register Now</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background py-24 lg:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 text-sm">
              <Handshake className="h-4 w-4" />
              {settings.heroSubtitle}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
              {settings.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {settings.heroDescription}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gap-2" asChild>
                <a href={`mailto:${settings.contactEmail}`}>
                  <Mail className="h-4 w-4" />
                  Get in Touch
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sponsor — Stats */}
      <section className="border-b border-border py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">{settings.whyTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{settings.whyDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 mb-16">
            {settings.whyStats.map((stat, i) => (
              <div key={i} className="rounded-2xl border bg-card p-8 text-center shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Benefits bullets */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: 'Targeted Audience', desc: 'Reach decision-makers — CEOs, managers, and entrepreneurs actively investing in growth.' },
              { icon: TrendingUp, title: 'Brand Visibility', desc: 'Your brand on all event materials: banners, digital content, programs, and social media.' },
              { icon: Building2, title: 'Business Networking', desc: 'Direct access to potential clients, partners, and talent in a premium event setting.' },
              { icon: Globe, title: 'Digital Presence', desc: 'Featured on our website, email campaigns, and social media before, during, and after the event.' },
              { icon: Award, title: 'Thought Leadership', desc: 'Speaking and panel opportunities to position your brand as an industry authority.' },
              { icon: Star, title: 'Exclusive Perks', desc: 'Complimentary registrations, exhibition space, and dedicated networking sessions.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl border bg-card">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsorship Tiers */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">Sponsorship Packages</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose the package that best aligns with your brand goals and budget.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map(tier => {
              const style = TIER_STYLES[tier.color] || TIER_STYLES.custom
              return (
                <div
                  key={tier.id}
                  className={cn(
                    'relative rounded-2xl border-2 bg-gradient-to-b p-6 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
                    style.gradient,
                    style.border,
                    tier.highlighted && style.ring,
                  )}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                        <Star className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  {/* Tier badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', style.badge)}>
                      {tier.name}
                    </span>
                  </div>
                  {/* Price */}
                  <div className="mb-3">
                    <span className={cn('text-3xl font-extrabold', style.price)}>
                      {formatCurrency(tier.price, tier.currency)}
                    </span>
                  </div>
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                    {tier.description}
                  </p>
                  {/* Benefits */}
                  <ul className="space-y-2.5 mb-8">
                    {tier.benefits.map((b, i) => (
                      <li key={i} className={cn('flex items-start gap-2.5 text-sm', !b.included && 'opacity-40')}>
                        {b.included
                          ? <CheckCircle2 className={cn('h-4 w-4 shrink-0 mt-0.5', style.check)} />
                          : <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
                        }
                        <span className={b.included ? 'text-foreground' : 'text-muted-foreground line-through'}>{b.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={cn('w-full gap-2', tier.highlighted ? '' : 'variant-outline')}
                    variant={tier.highlighted ? 'default' : 'outline'}
                  >
                    <a href={`mailto:${settings.contactEmail}?subject=Sponsorship Interest — ${tier.name} Package&body=Hello,%0A%0AI am interested in the ${tier.name} sponsorship package for the Executive Masterclass event. Please send me more details.%0A%0AThank you.`}>
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Current Sponsors */}
      {sponsors.length > 0 && (
        <section className="border-t border-border py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center text-foreground mb-10">Our Sponsors</h2>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {sponsors.map(sponsor => (
                <a
                  key={sponsor.id}
                  href={sponsor.websiteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
                >
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-14 max-w-[140px] object-contain grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <div className="flex h-14 items-center justify-center rounded-xl border bg-card px-6 font-semibold text-foreground">
                      {sponsor.name}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA / Contact */}
      <section className="border-t border-border py-20 bg-gradient-to-br from-primary/10 to-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Partner With Us?</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Contact our sponsorship team today to discuss how we can create a custom package
            that meets your brand objectives.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 text-sm font-medium hover:bg-accent transition-colors w-full sm:w-auto"
            >
              <Mail className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Email us</div>
                <div className="text-foreground">{settings.contactEmail}</div>
              </div>
            </a>
            <a
              href={`tel:${settings.contactPhone}`}
              className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 text-sm font-medium hover:bg-accent transition-colors w-full sm:w-auto"
            >
              <Phone className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Call us</div>
                <div className="text-foreground">{settings.contactPhone}</div>
              </div>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 text-sm font-medium hover:bg-accent transition-colors w-full sm:w-auto"
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">WhatsApp</div>
                <div className="text-foreground">{settings.contactWhatsApp}</div>
              </div>
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            We respond within 24 hours on business days.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Executive Masterclass</Link>
          {' '}&mdash; Tanzania&apos;s Premier Business Training Event
        </div>
      </footer>
    </div>
  )
}

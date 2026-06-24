'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { getSponsorshipTiers, getSponsors, getSponsorshipSettings } from '@/lib/store'
import type { SponsorshipTier, Sponsor, SponsorshipPageSettings } from '@/lib/types'
import { DEFAULT_SPONSORSHIP_TIERS, DEFAULT_SPONSORS, DEFAULT_SPONSORSHIP_SETTINGS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SponsorshipApplicationModal } from '@/components/sponsorship-application-modal'
import { useStoreReady } from '@/components/store-provider'

// ==================== PARTNERS CAROUSEL ====================

function PartnersCarousel({ sponsors }: { sponsors: Sponsor[] }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = sponsors.length

  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total])
  const prev = () => setCurrent(c => (c - 1 + total) % total)

  useEffect(() => {
    if (total <= 1) return
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next, total])

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 5000)
  }

  const goTo = (i: number) => { setCurrent(i); resetTimer() }
  const handlePrev = () => { prev(); resetTimer() }
  const handleNext = () => { next(); resetTimer() }

  if (total === 0) return null
  const sponsor = sponsors[current]

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-border">
            <div className="flex items-center justify-center bg-muted/40 p-10 min-h-[200px]">
              {sponsor.logoUrl ? (
                <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-28 max-w-[220px] object-contain" />
              ) : (
                <div className="flex h-24 w-full max-w-[220px] items-center justify-center rounded-xl border-2 border-dashed text-2xl font-bold text-muted-foreground">
                  {sponsor.name[0]}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 p-6 flex-1">
              <h3 className="text-lg font-bold text-foreground">{sponsor.name}</h3>
              {sponsor.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{sponsor.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Official partner of Executive Masterclass</p>
              )}
              {sponsor.websiteUrl && (
                <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit website
                </a>
              )}
            </div>
          </div>
          <div className="relative min-h-[260px] md:min-h-[360px] overflow-hidden bg-muted/20">
            {sponsor.bannerUrl ? (
              <img src={sponsor.bannerUrl} alt={`${sponsor.name} banner`} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center flex-col gap-3 text-muted-foreground">
                <Building2 className="h-16 w-16 opacity-20" />
                <span className="text-sm opacity-40">No banner uploaded</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {total > 1 && (
        <>
          <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 border shadow backdrop-blur-sm hover:bg-background transition-colors" aria-label="Previous partner">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 border shadow backdrop-blur-sm hover:bg-background transition-colors" aria-label="Next partner">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-center gap-2 mt-5">
            {sponsors.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={cn('rounded-full transition-all', i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60')} aria-label={`Go to partner ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const TIER_STYLES: Record<string, { gradient: string; border: string; badge: string; check: string; price: string; ring: string }> = {
  platinum: { gradient: 'from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-background', border: 'border-slate-300 dark:border-slate-600', badge: 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900', check: 'text-slate-600 dark:text-slate-300', price: 'text-slate-700 dark:text-slate-200', ring: 'ring-2 ring-slate-400 dark:ring-slate-500' },
  gold: { gradient: 'from-yellow-50 via-amber-50 to-white dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-background', border: 'border-yellow-300 dark:border-yellow-700', badge: 'bg-yellow-500 text-white', check: 'text-yellow-600 dark:text-yellow-400', price: 'text-yellow-700 dark:text-yellow-300', ring: 'ring-2 ring-yellow-400 dark:ring-yellow-600' },
  silver: { gradient: 'from-gray-50 via-slate-50 to-white dark:from-gray-900/40 dark:via-slate-900/30 dark:to-background', border: 'border-gray-300 dark:border-gray-600', badge: 'bg-gray-500 text-white', check: 'text-gray-500 dark:text-gray-400', price: 'text-gray-700 dark:text-gray-300', ring: '' },
  bronze: { gradient: 'from-orange-50 via-amber-50 to-white dark:from-orange-950/30 dark:via-amber-950/20 dark:to-background', border: 'border-orange-300 dark:border-orange-700', badge: 'bg-orange-600 text-white', check: 'text-orange-500 dark:text-orange-400', price: 'text-orange-700 dark:text-orange-300', ring: '' },
  custom: { gradient: 'from-primary/5 to-background', border: 'border-primary/40', badge: 'bg-primary text-primary-foreground', check: 'text-primary', price: 'text-primary', ring: '' },
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-TZ', { style: currency === 'TZS' ? 'decimal' : 'currency', currency, minimumFractionDigits: 0 }).format(amount) + (currency === 'TZS' ? ' TZS' : '')
}

interface SponsorshipContentProps {
  initialTiers?: SponsorshipTier[]
  initialSponsors?: Sponsor[]
  initialSettings?: SponsorshipPageSettings
}

export function SponsorshipContent({ initialTiers, initialSponsors, initialSettings }: SponsorshipContentProps = {}) {
  const storeReady = useStoreReady()
  const [tiers, setTiers] = useState<SponsorshipTier[]>(initialTiers ?? DEFAULT_SPONSORSHIP_TIERS.filter(t => t.active))
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors ?? DEFAULT_SPONSORS.filter(s => s.active))
  const [settings, setSettings] = useState<SponsorshipPageSettings>(initialSettings ?? DEFAULT_SPONSORSHIP_SETTINGS)
  const [applyTier, setApplyTier] = useState<SponsorshipTier | null>(null)
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set())
  const VISIBLE_COUNT = 4

  const toggleExpand = (id: string) => {
    setExpandedTiers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (!storeReady) return
    setTiers(getSponsorshipTiers())
    setSponsors(getSponsors())
    setSettings(getSponsorshipSettings())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  const whatsappUrl = `https://wa.me/${settings.contactWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I am interested in sponsoring the Executive Masterclass event. Please send me more information.')}`

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border min-h-[560px] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${settings.heroImageUrl || '/images/hero-1.jpg'}')` }} />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
              <Handshake className="h-4 w-4" />
              {settings.heroSubtitle}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">{settings.heroTitle}</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">{settings.heroDescription}</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <a href={`mailto:${settings.contactEmail}`}><Mail className="h-4 w-4" />Send Email</a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp Us</a>
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

      {/* Proposal Download */}
      {settings.proposalFileUrl && (
        <section className="border-b border-border py-12 bg-primary/5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-primary/20 bg-card px-8 py-7 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{settings.proposalTitle || 'Sponsorship Proposal'}</h3>
                  <p className="text-sm text-muted-foreground">Download our detailed sponsorship proposal to learn more about partnership opportunities</p>
                  {settings.proposalFileName && <p className="text-xs text-muted-foreground mt-0.5 opacity-70">{settings.proposalFileName}</p>}
                </div>
              </div>
              <a href={settings.proposalFileUrl} download={settings.proposalFileName || 'sponsorship-proposal'} className="shrink-0">
                <Button size="lg" className="gap-2"><Download className="h-4 w-4" />Download Proposal</Button>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Sponsorship Tiers */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${settings.packagesImageUrl || '/images/hero-2.jpg'}')` }} />
        <div className="absolute inset-0 bg-background/88 dark:bg-background/92" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">Sponsorship Packages</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Choose the package that best aligns with your brand goals and budget.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4 items-start">
            {tiers.map(tier => {
              const style = TIER_STYLES[tier.color] || TIER_STYLES.custom
              const isExpanded = expandedTiers.has(tier.id)
              const hasMore = tier.benefits.length > VISIBLE_COUNT
              const visibleBenefits = isExpanded ? tier.benefits : tier.benefits.slice(0, VISIBLE_COUNT)
              const hiddenCount = tier.benefits.length - VISIBLE_COUNT
              return (
                <div key={tier.id} className={cn('relative rounded-2xl border-2 bg-gradient-to-b p-6 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl', style.gradient, style.border, tier.highlighted && style.ring)}>
                  {tier.highlighted && (
                    <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                        <Star className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  {tier.imageUrl && (
                    <div className="mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-2xl">
                      <img src={tier.imageUrl} alt={tier.name} className="h-36 w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', style.badge)}>
                      {tier.name}
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className={cn('text-3xl font-extrabold', style.price)}>{formatCurrency(tier.price, tier.currency)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{tier.description}</p>

                  {/* Benefits list */}
                  <ul className="space-y-2.5 mb-3">
                    {visibleBenefits.map((b, i) => (
                      <li key={i} className={cn('flex items-start gap-2.5 text-sm', !b.included && 'opacity-40')}>
                        {b.included ? <CheckCircle2 className={cn('h-4 w-4 shrink-0 mt-0.5', style.check)} /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />}
                        <span className={b.included ? 'text-foreground' : 'text-muted-foreground line-through'}>{b.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* View more / less toggle */}
                  {hasMore && (
                    <button
                      onClick={() => toggleExpand(tier.id)}
                      className={cn('flex items-center gap-1.5 text-xs font-semibold mb-6 transition-colors', style.check, 'hover:opacity-80')}
                    >
                      {isExpanded ? (
                        <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                      ) : (
                        <><ChevronDown className="h-3.5 w-3.5" /> View {hiddenCount} more benefit{hiddenCount > 1 ? 's' : ''}</>
                      )}
                    </button>
                  )}
                  {!hasMore && <div className="mb-6" />}

                  <div className="mt-auto">
                    <Button className={cn('w-full gap-2')} variant={tier.highlighted ? 'default' : 'outline'} onClick={() => setApplyTier(tier)}>
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
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
            <h2 className="text-2xl font-bold text-center text-foreground mb-2">Our Partners</h2>
            <p className="text-center text-muted-foreground mb-10 text-sm">Companies that believe in our mission</p>
            <PartnersCarousel sponsors={sponsors} />
          </div>
        </section>
      )}

      {/* CTA / Contact */}
      <section className="border-t border-border py-20 bg-gradient-to-br from-primary/10 to-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Partner With Us?</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">Contact our sponsorship team today to discuss how we can create a custom package that meets your brand objectives.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 text-sm font-medium hover:bg-accent transition-colors w-full sm:w-auto">
              <Mail className="h-5 w-5 text-primary" />
              <div className="text-left"><div className="text-xs text-muted-foreground">Email us</div><div className="text-foreground">{settings.contactEmail}</div></div>
            </a>
            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 text-sm font-medium hover:bg-accent transition-colors w-full sm:w-auto">
              <Phone className="h-5 w-5 text-primary" />
              <div className="text-left"><div className="text-xs text-muted-foreground">Call us</div><div className="text-foreground">{settings.contactPhone}</div></div>
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 text-sm font-medium hover:bg-accent transition-colors w-full sm:w-auto">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <div className="text-left"><div className="text-xs text-muted-foreground">WhatsApp</div><div className="text-foreground">{settings.contactWhatsApp}</div></div>
            </a>
          </div>
          <p className="text-xs text-muted-foreground">We respond within 24 hours on business days.</p>
        </div>
      </section>

      <SiteFooter />

      <SponsorshipApplicationModal tier={applyTier} open={!!applyTier} onClose={() => setApplyTier(null)} />
    </div>
  )
}

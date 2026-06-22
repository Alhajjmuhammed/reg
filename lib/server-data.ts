// Server-side data helpers — safe to import in Server Components (no 'use client').
// Reads directly from SQLite so the initial HTML already contains correct DB data.
import { dbGet } from './db'
import type {
  SponsorshipTier,
  Sponsor,
  SponsorshipPageSettings,
  HeroSlide,
  SiteSettings,
  Trainer,
  CurriculumModule,
  AcademicPartner,
  AcademicPartnerSettings,
  GroupPricingTier,
  Package,
} from './types'
import {
  DEFAULT_SPONSORSHIP_TIERS,
  DEFAULT_SPONSORS,
  DEFAULT_SPONSORSHIP_SETTINGS,
  DEFAULT_HERO_SLIDES,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_TRAINERS,
  DEFAULT_CURRICULUM,
  DEFAULT_ACADEMIC_PARTNERS,
  DEFAULT_ACADEMIC_PARTNER_SETTINGS,
  GROUP_PRICING_TIERS,
  PACKAGES,
} from './types'

const K = {
  sponsorshipTiers:        'masterclass_sponsorship_tiers',
  sponsors:                'masterclass_sponsors',
  sponsorshipSettings:     'masterclass_sponsorship_settings',
  heroSlides:              'masterclass_hero_slides',
  siteSettings:            'masterclass_site_settings',
  trainers:                'masterclass_trainers',
  curriculum:              'masterclass_curriculum',
  academicPartners:        'masterclass_academic_partners',
  academicPartnerSettings: 'masterclass_academic_partner_settings',
  groupPricingTiers:       'masterclass_group_pricing_tiers',
  packages:                'masterclass_packages',
} as const

export function serverGetSponsorshipTiers(): SponsorshipTier[] {
  const stored = dbGet<SponsorshipTier[]>(K.sponsorshipTiers, [])
  if (stored.length === 0) return DEFAULT_SPONSORSHIP_TIERS
  return stored.filter(t => t.active).sort((a, b) => a.order - b.order)
}

export function serverGetSponsors(): Sponsor[] {
  const stored = dbGet<Sponsor[]>(K.sponsors, [])
  if (stored.length === 0) return DEFAULT_SPONSORS.filter(s => s.active)
  return stored.filter(s => s.active)
}

export function serverGetSponsorshipSettings(): SponsorshipPageSettings {
  return dbGet<SponsorshipPageSettings>(K.sponsorshipSettings, DEFAULT_SPONSORSHIP_SETTINGS)
}

export function serverGetHeroSlides(): HeroSlide[] {
  const stored = dbGet<HeroSlide[]>(K.heroSlides, [])
  if (stored.length === 0) return DEFAULT_HERO_SLIDES
  return stored.sort((a, b) => a.order - b.order)
}

export function serverGetSiteSettings(): SiteSettings {
  return dbGet<SiteSettings>(K.siteSettings, DEFAULT_SITE_SETTINGS)
}

export function serverGetTrainers(): Trainer[] {
  const stored = dbGet<Trainer[]>(K.trainers, [])
  if (stored.length === 0) return DEFAULT_TRAINERS.filter(t => t.active)
  return stored.filter(t => t.active).sort((a, b) => a.order - b.order)
}

export function serverGetCurriculum(): CurriculumModule[] {
  const stored = dbGet<CurriculumModule[]>(K.curriculum, [])
  if (stored.length === 0) return DEFAULT_CURRICULUM.filter(m => m.active)
  return stored.filter(m => m.active).sort((a, b) => a.order - b.order)
}

export function serverGetAcademicPartners(): AcademicPartner[] {
  const stored = dbGet<AcademicPartner[]>(K.academicPartners, [])
  if (stored.length === 0) return DEFAULT_ACADEMIC_PARTNERS.filter(p => p.active)
  return stored.filter(p => p.active)
}

export function serverGetAcademicPartnerSettings(): AcademicPartnerSettings {
  return dbGet<AcademicPartnerSettings>(K.academicPartnerSettings, DEFAULT_ACADEMIC_PARTNER_SETTINGS)
}

export function serverGetGroupPricingTiers(): GroupPricingTier[] {
  const stored = dbGet<GroupPricingTier[]>(K.groupPricingTiers, [])
  if (stored.length === 0) return GROUP_PRICING_TIERS
  return stored
}

export function serverGetPackages(): Package[] {
  const stored = dbGet<Package[]>(K.packages, [])
  if (stored.length === 0) return PACKAGES.map(p => ({ ...p, active: true }))
  return stored.filter(p => p.active)
}

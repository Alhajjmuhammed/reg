'use client'

import { v4 as uuidv4 } from 'uuid'
import type {
  Participant,
  GroupRegistration,
  SeatConfiguration,
  CouponCode,
  PaymentTransaction,
  WaitlistEntry,
  EmailNotification,
  PackageType,
  PaymentMethod,
  NotificationType,
  SiteSettings,
  HeroSlide,
  Trainer,
  CurriculumModule,
  FAQ,
  Testimonial,
  ChatbotQA,
  CompanyStat,
  Package,
  PaymentMethodConfig,
  UserAccount,
  TrainerAccount,
  TrainerMaterial,
  TrainerAnnouncement,
  AttendanceRecord,
  EventDocument,
  PackageSeatAllocation,
  SponsorshipTier,
  Sponsor,
  SponsorshipPageSettings,
  SponsorshipApplication,
  AdminCredential,
  UserRole,
  AcademicPartner,
  AcademicPartnerSettings,
  GroupPricingTier,
  TermsContent,
  AdminRole,
  SubAdminUser,
  AdminProfile,
  AdminSession,
  PermissionKey,
} from './types'
import {
  DEFAULT_SEAT_CONFIG,
  DEFAULT_COUPONS,
  PACKAGES,
  GROUP_PRICING_TIERS,
  getGroupPricing,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_HERO_SLIDES,
  DEFAULT_TRAINERS,
  DEFAULT_CURRICULUM,
  DEFAULT_FAQS,
  DEFAULT_TESTIMONIALS,
  DEFAULT_CHATBOT_QA,
  DEFAULT_COMPANY_STATS,
  PAYMENT_METHODS_CONFIG,
  DEFAULT_DOCUMENTS,
  DEFAULT_SPONSORSHIP_TIERS,
  DEFAULT_SPONSORS,
  DEFAULT_SPONSORSHIP_SETTINGS,
  DEFAULT_ADMIN_CREDENTIAL,
  DEFAULT_ACADEMIC_PARTNERS,
  DEFAULT_ACADEMIC_PARTNER_SETTINGS,
  DEFAULT_TERMS,
  DEFAULT_ADMIN_ROLES,
} from './types'

// ==================== DB SYNC ====================
// Keys stored only in localStorage (device-specific sessions, never synced)
const SESSION_KEYS = new Set([
  'masterclass_current_user',
  'masterclass_current_trainer',
  'masterclass_current_admin',
])

// In-memory store — all reads come from here (synchronous, no API latency)
const memStore: Record<string, unknown> = {}

// Set to true after initStore() completes. Guards seeding calls so that default
// values are never written to DB before we know what's actually stored there.
let storeInitialized = false

// Load all data from SQLite (via /api/store) into memStore on app start
export async function initStore(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch('/api/store')
    if (!res.ok) {
      console.error('DB load error, status:', res.status)
      return
    }
    const rows: { key: string; value: unknown }[] = await res.json()
    for (const row of rows) {
      memStore[row.key] = row.value
    }
    // Keep localStorage sub-admin cache in sync with what DB returned
    const subAdminsRow = rows.find(r => r.key === 'masterclass_sub_admins')
    if (subAdminsRow) {
      setLocalStorage('masterclass_sub_admins_local', subAdminsRow.value)
    }
  } catch (e) {
    console.error('initStore failed', e)
  } finally {
    storeInitialized = true
  }
}

// Re-fetch participants from DB into memStore right before seat assignment.
// Reduces (but cannot fully eliminate) the race window for concurrent registrations.
export async function refreshParticipants(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const res = await fetch(`/api/store?key=${STORAGE_KEYS.participants}`)
    if (res.ok) {
      const row: { key: string; value: unknown } | null = await res.json()
      if (row) {
        memStore[STORAGE_KEYS.participants] = row.value
      }
    }
  } catch {
    // proceed with cached data if DB is unreachable
  }
}

// Persist a single key to SQLite via /api/store (fire-and-forget from client)
async function syncToDb(key: string, value: unknown): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
  } catch (e) {
    console.error('DB sync failed for key', key, e)
  }
}

// Storage Keys
const STORAGE_KEYS = {
  participants: 'masterclass_participants',
  groups: 'masterclass_groups',
  seats: 'masterclass_seats',
  coupons: 'masterclass_coupons',
  transactions: 'masterclass_transactions',
  waitlist: 'masterclass_waitlist',
  notifications: 'masterclass_notifications',
  // Configurable content
  siteSettings: 'masterclass_site_settings',
  heroSlides: 'masterclass_hero_slides',
  trainers: 'masterclass_trainers',
  curriculum: 'masterclass_curriculum',
  faqs: 'masterclass_faqs',
  testimonials: 'masterclass_testimonials',
  chatbotQA: 'masterclass_chatbot_qa',
  companyStats: 'masterclass_company_stats',
  packages: 'masterclass_packages',
  paymentMethods: 'masterclass_payment_methods',
  // Auth & documents
  userAccounts: 'masterclass_user_accounts',
  currentUser: 'masterclass_current_user',
  documents: 'masterclass_documents',
  // Sponsorship
  sponsorshipTiers: 'masterclass_sponsorship_tiers',
  sponsors: 'masterclass_sponsors',
  sponsorshipSettings: 'masterclass_sponsorship_settings',
  sponsorshipApplications: 'masterclass_sponsorship_applications',
  // Trainer portal
  trainerAccounts: 'masterclass_trainer_accounts',
  currentTrainer: 'masterclass_current_trainer',
  trainerMaterials: 'masterclass_trainer_materials',
  trainerAnnouncements: 'masterclass_trainer_announcements',
  attendance: 'masterclass_attendance',
  // Admin credential
  adminCredential: 'masterclass_admin_credential',
  currentAdmin: 'masterclass_current_admin',
  groupPricingTiers: 'masterclass_group_pricing_tiers',
  // Academic partners
  academicPartners: 'masterclass_academic_partners',
  academicPartnerSettings: 'masterclass_academic_partner_settings',
  // Terms & Conditions
  termsContent: 'masterclass_terms_content',
  // Admin roles & users
  adminRoles: 'masterclass_admin_roles',
  subAdmins: 'masterclass_sub_admins',
  adminProfile: 'masterclass_admin_profile',
}

// Helper to safely access localStorage (session keys only)
function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('Failed to save to localStorage')
  }
}

function getStorage<T>(key: string, defaultValue: T): T {
  if (SESSION_KEYS.has(key)) return getLocalStorage(key, defaultValue)
  if (key in memStore) return memStore[key] as T
  return defaultValue
}

function setStorage<T>(key: string, value: T): void {
  if (SESSION_KEYS.has(key)) {
    setLocalStorage(key, value)
    return
  }
  memStore[key] = value
  syncToDb(key, value)
}

// Seed a default value only after initStore() has confirmed no value exists in Supabase.
// Before initStore completes, writes only to the local memStore so this session has
// something to render — but NEVER syncs to Supabase (which would overwrite admin data).
function seedIfReady<T>(key: string, value: T): void {
  memStore[key] = value
  if (storeInitialized) {
    syncToDb(key, value)
  }
}

// Generate a temporary login password for new accounts
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = 'Mc@'
  for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

// Generate receipt number
function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `MC${year}${month}-${random}`
}

// ==================== SITE SETTINGS ====================

export function getSiteSettings(): SiteSettings {
  return getStorage<SiteSettings>(STORAGE_KEYS.siteSettings, DEFAULT_SITE_SETTINGS)
}

export function updateSiteSettings(data: Partial<SiteSettings>): SiteSettings {
  const settings = getSiteSettings()
  const updated = { ...settings, ...data }
  setStorage(STORAGE_KEYS.siteSettings, updated)
  return updated
}

// ==================== HERO SLIDES ====================

export function getHeroSlides(): HeroSlide[] {
  const stored = getStorage<HeroSlide[]>(STORAGE_KEYS.heroSlides, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.heroSlides, DEFAULT_HERO_SLIDES)
    return DEFAULT_HERO_SLIDES
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function createHeroSlide(data: Omit<HeroSlide, 'id'>): HeroSlide {
  const slides = getHeroSlides()
  const newSlide: HeroSlide = { ...data, id: uuidv4() }
  slides.push(newSlide)
  setStorage(STORAGE_KEYS.heroSlides, slides)
  return newSlide
}

export function updateHeroSlide(id: string, data: Partial<HeroSlide>): HeroSlide | null {
  const slides = getHeroSlides()
  const index = slides.findIndex(s => s.id === id)
  if (index === -1) return null
  slides[index] = { ...slides[index], ...data }
  setStorage(STORAGE_KEYS.heroSlides, slides)
  return slides[index]
}

export function deleteHeroSlide(id: string): boolean {
  const slides = getHeroSlides()
  const filtered = slides.filter(s => s.id !== id)
  if (filtered.length === slides.length) return false
  setStorage(STORAGE_KEYS.heroSlides, filtered)
  return true
}

export function reorderHeroSlides(slideIds: string[]): HeroSlide[] {
  const slides = getHeroSlides()
  slideIds.forEach((id, index) => {
    const slide = slides.find(s => s.id === id)
    if (slide) slide.order = index + 1
  })
  setStorage(STORAGE_KEYS.heroSlides, slides)
  return slides.sort((a, b) => a.order - b.order)
}

// ==================== TRAINERS ====================

export function getTrainers(): Trainer[] {
  const stored = getStorage<Trainer[]>(STORAGE_KEYS.trainers, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.trainers, DEFAULT_TRAINERS)
    return DEFAULT_TRAINERS
  }
  return stored.filter(t => t.active).sort((a, b) => a.order - b.order)
}

export function getAllTrainers(): Trainer[] {
  const stored = getStorage<Trainer[]>(STORAGE_KEYS.trainers, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.trainers, DEFAULT_TRAINERS)
    return DEFAULT_TRAINERS
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function getTrainerById(id: string): Trainer | null {
  return getAllTrainers().find(t => t.id === id) || null
}

export function createTrainer(data: Omit<Trainer, 'id'>): Trainer {
  const trainers = getAllTrainers()
  const newTrainer: Trainer = { ...data, id: uuidv4() }
  trainers.push(newTrainer)
  setStorage(STORAGE_KEYS.trainers, trainers)
  return newTrainer
}

export function updateTrainer(id: string, data: Partial<Trainer>): Trainer | null {
  const trainers = getAllTrainers()
  const index = trainers.findIndex(t => t.id === id)
  if (index === -1) return null
  trainers[index] = { ...trainers[index], ...data }
  setStorage(STORAGE_KEYS.trainers, trainers)
  return trainers[index]
}

export function deleteTrainer(id: string): boolean {
  const trainers = getAllTrainers()
  const filtered = trainers.filter(t => t.id !== id)
  if (filtered.length === trainers.length) return false
  setStorage(STORAGE_KEYS.trainers, filtered)
  // Clean up related records
  const accounts = getAllTrainerAccounts()
  setStorage(STORAGE_KEYS.trainerAccounts, accounts.filter(a => a.trainerId !== id))
  const materials = getStorage<TrainerMaterial[]>(STORAGE_KEYS.trainerMaterials, [])
  setStorage(STORAGE_KEYS.trainerMaterials, materials.filter(m => m.trainerId !== id))
  const announcements = getStorage<TrainerAnnouncement[]>(STORAGE_KEYS.trainerAnnouncements, [])
  setStorage(STORAGE_KEYS.trainerAnnouncements, announcements.filter(a => a.trainerId !== id))
  const attendance = getStorage<AttendanceRecord[]>(STORAGE_KEYS.attendance, [])
  setStorage(STORAGE_KEYS.attendance, attendance.filter(r => r.trainerId !== id))
  return true
}

// ==================== CURRICULUM ====================

export function getCurriculum(): CurriculumModule[] {
  const stored = getStorage<CurriculumModule[]>(STORAGE_KEYS.curriculum, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.curriculum, DEFAULT_CURRICULUM)
    return DEFAULT_CURRICULUM
  }
  return stored.filter(m => m.active).sort((a, b) => a.order - b.order)
}

export function getAllCurriculum(): CurriculumModule[] {
  const stored = getStorage<CurriculumModule[]>(STORAGE_KEYS.curriculum, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.curriculum, DEFAULT_CURRICULUM)
    return DEFAULT_CURRICULUM
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function createCurriculumModule(data: Omit<CurriculumModule, 'id'>): CurriculumModule {
  const modules = getAllCurriculum()
  const newModule: CurriculumModule = { ...data, id: uuidv4() }
  modules.push(newModule)
  setStorage(STORAGE_KEYS.curriculum, modules)
  return newModule
}

export function updateCurriculumModule(id: string, data: Partial<CurriculumModule>): CurriculumModule | null {
  const modules = getAllCurriculum()
  const index = modules.findIndex(m => m.id === id)
  if (index === -1) return null
  modules[index] = { ...modules[index], ...data }
  setStorage(STORAGE_KEYS.curriculum, modules)
  return modules[index]
}

export function deleteCurriculumModule(id: string): boolean {
  const modules = getAllCurriculum()
  const filtered = modules.filter(m => m.id !== id)
  if (filtered.length === modules.length) return false
  setStorage(STORAGE_KEYS.curriculum, filtered)
  return true
}

// ==================== FAQS ====================

export function getFAQs(): FAQ[] {
  const stored = getStorage<FAQ[]>(STORAGE_KEYS.faqs, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.faqs, DEFAULT_FAQS)
    return DEFAULT_FAQS
  }
  return stored.filter(f => f.active).sort((a, b) => a.order - b.order)
}

export function getAllFAQs(): FAQ[] {
  const stored = getStorage<FAQ[]>(STORAGE_KEYS.faqs, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.faqs, DEFAULT_FAQS)
    return DEFAULT_FAQS
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function createFAQ(data: Omit<FAQ, 'id'>): FAQ {
  const faqs = getAllFAQs()
  const newFaq: FAQ = { ...data, id: uuidv4() }
  faqs.push(newFaq)
  setStorage(STORAGE_KEYS.faqs, faqs)
  return newFaq
}

export function updateFAQ(id: string, data: Partial<FAQ>): FAQ | null {
  const faqs = getAllFAQs()
  const index = faqs.findIndex(f => f.id === id)
  if (index === -1) return null
  faqs[index] = { ...faqs[index], ...data }
  setStorage(STORAGE_KEYS.faqs, faqs)
  return faqs[index]
}

export function deleteFAQ(id: string): boolean {
  const faqs = getAllFAQs()
  const filtered = faqs.filter(f => f.id !== id)
  if (filtered.length === faqs.length) return false
  setStorage(STORAGE_KEYS.faqs, filtered)
  return true
}

// ==================== TESTIMONIALS ====================

export function getTestimonials(): Testimonial[] {
  const stored = getStorage<Testimonial[]>(STORAGE_KEYS.testimonials, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.testimonials, DEFAULT_TESTIMONIALS)
    return DEFAULT_TESTIMONIALS
  }
  return stored.filter(t => t.active).sort((a, b) => a.order - b.order)
}

export function getAllTestimonials(): Testimonial[] {
  const stored = getStorage<Testimonial[]>(STORAGE_KEYS.testimonials, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.testimonials, DEFAULT_TESTIMONIALS)
    return DEFAULT_TESTIMONIALS
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function createTestimonial(data: Omit<Testimonial, 'id'>): Testimonial {
  const testimonials = getAllTestimonials()
  const newTestimonial: Testimonial = { ...data, id: uuidv4() }
  testimonials.push(newTestimonial)
  setStorage(STORAGE_KEYS.testimonials, testimonials)
  return newTestimonial
}

export function updateTestimonial(id: string, data: Partial<Testimonial>): Testimonial | null {
  const testimonials = getAllTestimonials()
  const index = testimonials.findIndex(t => t.id === id)
  if (index === -1) return null
  testimonials[index] = { ...testimonials[index], ...data }
  setStorage(STORAGE_KEYS.testimonials, testimonials)
  return testimonials[index]
}

export function deleteTestimonial(id: string): boolean {
  const testimonials = getAllTestimonials()
  const filtered = testimonials.filter(t => t.id !== id)
  if (filtered.length === testimonials.length) return false
  setStorage(STORAGE_KEYS.testimonials, filtered)
  return true
}

// ==================== CHATBOT QA ====================

export function getChatbotQA(): ChatbotQA[] {
  const stored = getStorage<ChatbotQA[]>(STORAGE_KEYS.chatbotQA, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.chatbotQA, DEFAULT_CHATBOT_QA)
    return DEFAULT_CHATBOT_QA
  }
  return stored.filter(q => q.active).sort((a, b) => a.order - b.order)
}

export function getAllChatbotQA(): ChatbotQA[] {
  const stored = getStorage<ChatbotQA[]>(STORAGE_KEYS.chatbotQA, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.chatbotQA, DEFAULT_CHATBOT_QA)
    return DEFAULT_CHATBOT_QA
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function createChatbotQA(data: Omit<ChatbotQA, 'id'>): ChatbotQA {
  const qas = getAllChatbotQA()
  const newQA: ChatbotQA = { ...data, id: uuidv4() }
  qas.push(newQA)
  setStorage(STORAGE_KEYS.chatbotQA, qas)
  return newQA
}

export function updateChatbotQA(id: string, data: Partial<ChatbotQA>): ChatbotQA | null {
  const qas = getAllChatbotQA()
  const index = qas.findIndex(q => q.id === id)
  if (index === -1) return null
  qas[index] = { ...qas[index], ...data }
  setStorage(STORAGE_KEYS.chatbotQA, qas)
  return qas[index]
}

export function deleteChatbotQA(id: string): boolean {
  const qas = getAllChatbotQA()
  const filtered = qas.filter(q => q.id !== id)
  if (filtered.length === qas.length) return false
  setStorage(STORAGE_KEYS.chatbotQA, filtered)
  return true
}

export function findChatbotResponse(message: string): ChatbotQA | null {
  const qas = getChatbotQA()
  const lowerMessage = message.toLowerCase()
  
  for (const qa of qas) {
    for (const keyword of qa.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return qa
      }
    }
  }
  return null
}

// ==================== COMPANY STATS ====================

export function getCompanyStats(): CompanyStat[] {
  const stored = getStorage<CompanyStat[]>(STORAGE_KEYS.companyStats, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.companyStats, DEFAULT_COMPANY_STATS)
    return DEFAULT_COMPANY_STATS
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function updateCompanyStats(stats: CompanyStat[]): CompanyStat[] {
  setStorage(STORAGE_KEYS.companyStats, stats)
  return stats
}

// ==================== PACKAGES ====================

export function getPackages(): Package[] {
  if (typeof window === 'undefined') return []
  const stored = getStorage<Package[]>(STORAGE_KEYS.packages, [])
  if (stored.length === 0) {
    const packagesWithActive = PACKAGES.map(p => ({ ...p, active: true }))
    seedIfReady(STORAGE_KEYS.packages, packagesWithActive)
    return packagesWithActive
  }
  return stored.filter(p => p.active)
}

export function getAllPackages(): Package[] {
  if (typeof window === 'undefined') return []
  const stored = getStorage<Package[]>(STORAGE_KEYS.packages, [])
  if (stored.length === 0) {
    const packagesWithActive = PACKAGES.map(p => ({ ...p, active: true }))
    seedIfReady(STORAGE_KEYS.packages, packagesWithActive)
    return packagesWithActive
  }
  // Backfill any new fields added to PACKAGES defaults that aren't in stored data yet
  return stored.map(pkg => {
    const def = PACKAGES.find(p => p.id === pkg.id)
    return def ? { ...def, ...pkg } : pkg
  })
}

export function updatePackage(id: PackageType, data: Partial<Package>): Package | null {
  const packages = getAllPackages()
  const index = packages.findIndex(p => p.id === id)
  if (index === -1) return null
  packages[index] = { ...packages[index], ...data }
  setStorage(STORAGE_KEYS.packages, packages)
  return packages[index]
}

export function createPackage(data: Omit<Package, 'id'>): Package {
  const packages = getAllPackages()
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'package'
  let id = slug
  let counter = 1
  while (packages.some(p => p.id === id)) id = `${slug}-${counter++}`
  const newPackage: Package = { ...data, id }
  setStorage(STORAGE_KEYS.packages, [...packages, newPackage])
  return newPackage
}

export function deletePackage(id: string): void {
  const packages = getAllPackages().filter(p => p.id !== id)
  setStorage(STORAGE_KEYS.packages, packages)
  const stored = getStorage<SeatConfiguration>(STORAGE_KEYS.seats, DEFAULT_SEAT_CONFIG)
  if (stored.packageSeats) {
    const { [id]: _removed, ...rest } = stored.packageSeats
    setStorage(STORAGE_KEYS.seats, { ...stored, packageSeats: rest })
  }
}

// ==================== GROUP PRICING TIERS ====================

export function getGroupPricingTiers(): GroupPricingTier[] {
  const stored = getStorage<GroupPricingTier[]>(STORAGE_KEYS.groupPricingTiers, [])
  return stored.length > 0 ? stored : GROUP_PRICING_TIERS
}

export function updateGroupPricingTiers(tiers: GroupPricingTier[]): void {
  setStorage(STORAGE_KEYS.groupPricingTiers, tiers)
}

export function computeGroupPricing(seats: number, basePackage: PackageType) {
  const tiers = getGroupPricingTiers()
  const pkg = getAllPackages().find(p => p.id === basePackage)
  return getGroupPricing(seats, basePackage, tiers, pkg?.price)
}

// ==================== PAYMENT METHODS ====================

function migratePaymentMethods(stored: PaymentMethodConfig[]): PaymentMethodConfig[] {
  let changed = false
  const result = [...stored]
  for (const def of PAYMENT_METHODS_CONFIG) {
    const idx = result.findIndex(m => m.id === def.id)
    if (idx === -1) {
      const mpesaIdx = result.findIndex(m => m.id === 'mpesa')
      const insertAt = mpesaIdx >= 0 ? mpesaIdx + 1 : result.length
      result.splice(insertAt, 0, def)
      changed = true
    } else {
      // Sync non-admin-editable fields so renamed/updated config (name, icon,
      // instructions, accountInfo) reaches browsers with stale cached data.
      // `active` is admin-controlled via settings, so it's preserved.
      const existing = result[idx]
      if (
        existing.name !== def.name ||
        existing.icon !== def.icon ||
        existing.instructions !== def.instructions ||
        existing.accountInfo !== def.accountInfo
      ) {
        result[idx] = { ...existing, name: def.name, icon: def.icon, instructions: def.instructions, accountInfo: def.accountInfo }
        changed = true
      }
    }
  }
  if (changed) setStorage(STORAGE_KEYS.paymentMethods, result)
  return result
}

export function getPaymentMethods(): PaymentMethodConfig[] {
  const stored = getStorage<PaymentMethodConfig[]>(STORAGE_KEYS.paymentMethods, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.paymentMethods, PAYMENT_METHODS_CONFIG)
    return PAYMENT_METHODS_CONFIG
  }
  return migratePaymentMethods(stored).filter(p => p.active)
}

export function getAllPaymentMethods(): PaymentMethodConfig[] {
  const stored = getStorage<PaymentMethodConfig[]>(STORAGE_KEYS.paymentMethods, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.paymentMethods, PAYMENT_METHODS_CONFIG)
    return PAYMENT_METHODS_CONFIG
  }
  return migratePaymentMethods(stored)
}

export function updatePaymentMethod(id: string, data: Partial<PaymentMethodConfig>): PaymentMethodConfig | null {
  const methods = getAllPaymentMethods()
  const index = methods.findIndex(m => m.id === id)
  if (index === -1) return null
  methods[index] = { ...methods[index], ...data }
  setStorage(STORAGE_KEYS.paymentMethods, methods)
  return methods[index]
}

// ==================== SEAT MANAGEMENT ====================

export function getSeatConfiguration(): SeatConfiguration {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SEAT_CONFIG, packageSeats: { ...DEFAULT_SEAT_CONFIG.packageSeats } }
  }
  const stored: SeatConfiguration = getStorage<SeatConfiguration>(
    STORAGE_KEYS.seats,
    { ...DEFAULT_SEAT_CONFIG, packageSeats: { ...DEFAULT_SEAT_CONFIG.packageSeats } }
  )

  if (!stored.packageSeats) {
    stored.packageSeats = { ...DEFAULT_SEAT_CONFIG.packageSeats }
    setStorage(STORAGE_KEYS.seats, stored)
  }
  // Auto-add seat entries for any packages that don't have one yet
  let changed = false
  const packages = getAllPackages()
  for (const pkg of packages) {
    if (!(pkg.id in stored.packageSeats)) {
      stored.packageSeats[pkg.id] = 0
      changed = true
    }
  }
  if (changed) setStorage(STORAGE_KEYS.seats, stored)
  const participants = getParticipants()
  const confirmedSeats = participants.filter(p => p.status === 'confirmed').length
  const reservedSeats = participants.filter(p => p.status === 'pending').length
  const waitlistCount = getWaitlist().length
  const total = Object.values(stored.packageSeats).reduce((sum, n) => sum + n, 0)
  return {
    ...stored,
    totalSeats: total,
    confirmedSeats,
    reservedSeats,
    availableSeats: total - confirmedSeats - reservedSeats,
    waitlistCount,
  }
}

export function updatePackageSeats(allocation: PackageSeatAllocation): SeatConfiguration {
  const config = getSeatConfiguration()
  const total = Object.values(allocation).reduce((sum, n) => sum + n, 0)
  const newConfig: SeatConfiguration = {
    ...config,
    packageSeats: allocation,
    totalSeats: total,
    availableSeats: total - config.confirmedSeats - config.reservedSeats,
  }
  setStorage(STORAGE_KEYS.seats, newConfig)
  return newConfig
}

// Keep for backward compat
export function updateTotalSeats(totalSeats: number): SeatConfiguration {
  return updatePackageSeats(getSeatConfiguration().packageSeats)
}

/**
 * Seat layout order (closest to stage first): VIP → Standard → Early Bird
 * VIP:        seats 1 … vipCount
 * Standard:   vipCount+1 … vipCount+standardCount
 * Early Bird: rest
 */
export function getSeatRangeForPackage(pkg: string): { start: number; end: number } {
  const config = getSeatConfiguration()
  let start = 1
  for (const [id, count] of Object.entries(config.packageSeats)) {
    if (id === pkg) return { start, end: start + count - 1 }
    start += count
  }
  return { start: 1, end: 0 }
}

// Returns a map of seatNumber → packageType for all booked seats
export function getBookedSeats(): Map<string, PackageType> {
  const participants = getParticipants()
  const booked = new Map<string, PackageType>()
  for (const p of participants) {
    if (p.seatNumbers) {
      for (const seatNum of p.seatNumbers) {
        booked.set(String(seatNum), p.selectedPackage)
      }
    }
  }
  return booked
}

export function reserveSeats(count: number, pkg: PackageType): number[] | null {
  const range = getSeatRangeForPackage(pkg)
  const participants = getParticipants()
  const takenSeats = new Set(participants.flatMap(p => p.seatNumbers || []))
  const assignedSeats: number[] = []
  for (let i = range.start; i <= range.end && assignedSeats.length < count; i++) {
    if (!takenSeats.has(i)) assignedSeats.push(i)
  }
  return assignedSeats.length === count ? assignedSeats : null
}

// ==================== COUPON MANAGEMENT ====================

export function getCoupons(): CouponCode[] {
  const stored = getStorage<CouponCode[]>(STORAGE_KEYS.coupons, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.coupons, DEFAULT_COUPONS)
    return DEFAULT_COUPONS
  }
  return stored
}

export function validateCoupon(
  code: string, 
  packageType: PackageType, 
  totalAmount: number
): { valid: boolean; coupon?: CouponCode; discount: number; message: string } {
  const coupons = getCoupons()
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase())
  
  if (!coupon) {
    return { valid: false, discount: 0, message: 'Invalid coupon code' }
  }
  
  if (new Date(coupon.validUntil) < new Date()) {
    return { valid: false, discount: 0, message: 'Coupon has expired' }
  }
  
  if (coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, message: 'Coupon usage limit reached' }
  }
  
  if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
    return { 
      valid: false, 
      discount: 0, 
      message: `Minimum purchase of TZS ${coupon.minPurchase.toLocaleString()} required` 
    }
  }
  
  if (coupon.applicablePackages && !coupon.applicablePackages.includes(packageType)) {
    return { valid: false, discount: 0, message: 'Coupon not valid for this package' }
  }
  
  const discount = coupon.discountType === 'percentage'
    ? Math.round(totalAmount * (coupon.discountValue / 100))
    : coupon.discountValue
  
  return { 
    valid: true, 
    coupon, 
    discount, 
    message: `${coupon.description} applied!` 
  }
}

export function useCoupon(code: string): boolean {
  const coupons = getCoupons()
  const index = coupons.findIndex(c => c.code.toUpperCase() === code.toUpperCase())
  if (index === -1) return false
  
  coupons[index].usedCount++
  setStorage(STORAGE_KEYS.coupons, coupons)
  return true
}

export function createCoupon(coupon: Omit<CouponCode, 'usedCount'>): CouponCode {
  const coupons = getCoupons()
  const newCoupon: CouponCode = { ...coupon, usedCount: 0 }
  coupons.push(newCoupon)
  setStorage(STORAGE_KEYS.coupons, coupons)
  return newCoupon
}

export function updateCoupon(code: string, data: Partial<CouponCode>): CouponCode | null {
  const coupons = getCoupons()
  const index = coupons.findIndex(c => c.code === code)
  if (index === -1) return null
  
  coupons[index] = { ...coupons[index], ...data }
  setStorage(STORAGE_KEYS.coupons, coupons)
  return coupons[index]
}

export function deleteCoupon(code: string): boolean {
  const coupons = getCoupons()
  const filtered = coupons.filter(c => c.code !== code)
  if (filtered.length === coupons.length) return false
  setStorage(STORAGE_KEYS.coupons, filtered)
  return true
}

// ==================== PAYMENT TRANSACTIONS ====================

export function getTransactions(): PaymentTransaction[] {
  return getStorage<PaymentTransaction[]>(STORAGE_KEYS.transactions, [])
}

export function createTransaction(data: Omit<PaymentTransaction, 'id' | 'createdAt'>): PaymentTransaction {
  const transactions = getTransactions()
  const transaction: PaymentTransaction = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }
  transactions.push(transaction)
  setStorage(STORAGE_KEYS.transactions, transactions)
  return transaction
}

export function updateTransaction(id: string, data: Partial<PaymentTransaction>): PaymentTransaction | null {
  const transactions = getTransactions()
  const index = transactions.findIndex(t => t.id === id)
  if (index === -1) return null
  
  transactions[index] = { ...transactions[index], ...data }
  setStorage(STORAGE_KEYS.transactions, transactions)
  return transactions[index]
}

export function getTransactionsByParticipant(participantId: string): PaymentTransaction[] {
  return getTransactions().filter(t => t.participantId === participantId)
}

export function processPayment(
  participantId: string,
  amount: number,
  method: PaymentMethod,
  details: { phoneNumber?: string; cardLast4?: string }
): Promise<PaymentTransaction> {
  return new Promise((resolve, reject) => {
    const transaction = createTransaction({
      participantId,
      amount,
      paymentMethod: method,
      status: 'processing',
      reference: `TXN${Date.now()}`,
      phoneNumber: details.phoneNumber,
      cardLast4: details.cardLast4,
    })
    
    setTimeout(() => {
      const success = Math.random() > 0.1
      
      if (success) {
        const completed = updateTransaction(transaction.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        })
        
        const participant = getParticipantById(participantId)
        if (participant) {
          const newAmountPaid = participant.amountPaid + amount
          const newPaymentStatus = newAmountPaid >= participant.totalAmount ? 'paid' : 'partial'
          const newStatus = newPaymentStatus === 'paid' ? 'confirmed' : participant.status
          
          updateParticipant(participantId, {
            amountPaid: newAmountPaid,
            paymentStatus: newPaymentStatus,
            paymentMethod: method,
            paymentReference: transaction.reference,
            status: newStatus,
            seatNumbers: newStatus === 'confirmed' ? reserveSeats(1, participant.selectedPackage) || undefined : undefined,
            receiptNumber: newPaymentStatus === 'paid' ? generateReceiptNumber() : undefined,
          })
          
          if (newPaymentStatus === 'paid') {
            sendNotification(participant.email, participant.fullName, 'payment_received', participantId, {
              selectedPackage: participant.selectedPackage,
              totalAmount: participant.totalAmount,
              paymentMethod: participant.paymentMethod,
            })
          }
        }
        
        resolve(completed!)
      } else {
        updateTransaction(transaction.id, {
          status: 'failed',
          failureReason: 'Payment declined. Please try again.',
        })
        reject(new Error('Payment declined'))
      }
    }, 2000)
  })
}

// ==================== WAITLIST MANAGEMENT ====================

export function getWaitlist(): WaitlistEntry[] {
  return getStorage<WaitlistEntry[]>(STORAGE_KEYS.waitlist, [])
}

export function addToWaitlist(data: Omit<WaitlistEntry, 'id' | 'registrationDate' | 'notified' | 'convertedToParticipant'>): WaitlistEntry {
  const waitlist = getWaitlist()
  const entry: WaitlistEntry = {
    ...data,
    id: uuidv4(),
    registrationDate: new Date().toISOString(),
    notified: false,
    convertedToParticipant: false,
  }
  waitlist.push(entry)
  setStorage(STORAGE_KEYS.waitlist, waitlist)
  
  sendNotification(entry.email, entry.fullName, 'waitlist_added')
  
  return entry
}

export function convertWaitlistToParticipant(waitlistId: string, participantId: string): boolean {
  const waitlist = getWaitlist()
  const index = waitlist.findIndex(w => w.id === waitlistId)
  if (index === -1) return false
  
  waitlist[index].convertedToParticipant = true
  waitlist[index].participantId = participantId
  setStorage(STORAGE_KEYS.waitlist, waitlist)
  return true
}

export function notifyWaitlist(count: number = 5): WaitlistEntry[] {
  const waitlist = getWaitlist()
  const config = getSeatConfiguration()
  
  if (config.availableSeats <= 0) return []
  
  const toNotify = waitlist
    .filter(w => !w.notified && !w.convertedToParticipant)
    .slice(0, Math.min(count, config.availableSeats))
  
  toNotify.forEach(entry => {
    entry.notified = true
    sendNotification(entry.email, entry.fullName, 'waitlist_available')
  })
  
  setStorage(STORAGE_KEYS.waitlist, waitlist)
  return toNotify
}

// ==================== EMAIL NOTIFICATIONS ====================

export function getNotifications(): EmailNotification[] {
  return getStorage<EmailNotification[]>(STORAGE_KEYS.notifications, [])
}

export function sendNotification(
  email: string,
  name: string,
  type: NotificationType,
  participantId?: string,
  emailData?: {
    selectedPackage?: string
    seatNumbers?: number[]
    receiptNumber?: string
    totalAmount?: number
    paymentMethod?: string
    loginEmail?: string
    loginPassword?: string
    declineReason?: string
  }
): EmailNotification {
  const notifications = getNotifications()

  const subjects: Record<NotificationType, string> = {
    registration_confirmation: 'Registration Received',
    payment_received: 'Payment Received',
    payment_reminder: 'Payment Reminder',
    seat_confirmed: 'Your Seat is Confirmed',
    payment_declined: 'Payment Not Approved',
    waitlist_added: 'Added to Waitlist',
    waitlist_available: 'Seat Available for You!',
    event_reminder: 'Event Reminder',
    receipt: 'Payment Receipt',
  }

  const notification: EmailNotification = {
    id: uuidv4(),
    recipientEmail: email,
    recipientName: name,
    type,
    subject: subjects[type],
    sentAt: new Date().toISOString(),
    participantId,
  }

  notifications.push(notification)
  setStorage(STORAGE_KEYS.notifications, notifications)

  // Fire-and-forget: send actual email via server-side API route
  if (typeof window !== 'undefined') {
    const settings = getSiteSettings()
    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        to: email,
        name,
        eventName: settings.eventName,
        eventDate: settings.eventDate,
        eventTime: settings.eventTime,
        eventVenue: settings.eventVenue,
        eventAddress: settings.eventAddress,
        currency: 'TZS',
        loginUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
        ...emailData,
      }),
    }).catch(err => console.error('[sendNotification] email API error:', err))
  }

  return notification
}

// ==================== PARTICIPANT CRUD ====================

export function getParticipants(): Participant[] {
  return getStorage<Participant[]>(STORAGE_KEYS.participants, [])
}

export function getParticipantById(id: string): Participant | undefined {
  const participants = getParticipants()
  return participants.find((p) => p.id === id)
}

export function getParticipantByEmail(email: string): Participant | undefined {
  return getParticipants().find(p => p.email.toLowerCase() === email.toLowerCase())
}

export function createParticipant(
  data: Omit<Participant, 'id' | 'registrationDate' | 'lastUpdated' | 'receiptNumber' | 'seatNumbers'> & { preferredSeats?: number[] }
): Participant {
  const participants = getParticipants()

  // Reject duplicate email — one active registration per email address
  const emailLower = data.email.toLowerCase()
  const existingByEmail = participants.find(
    p => p.email.toLowerCase() === emailLower && p.status !== 'cancelled'
  )
  if (existingByEmail) {
    throw new Error('EMAIL_ALREADY_REGISTERED')
  }

  const config = getSeatConfiguration()
  const now = new Date().toISOString()

  let status = data.status
  let seatNumbers: number[] | undefined

  const seatCount = data.groupSeats ?? 1
  if (config.availableSeats < seatCount) {
    status = 'waitlist'
  } else if (data.paymentStatus === 'paid') {
    const takenSeats = new Set(participants.flatMap(p => p.seatNumbers || []))
    if (data.preferredSeats && data.preferredSeats.length === seatCount && data.preferredSeats.every(s => !takenSeats.has(s))) {
      seatNumbers = data.preferredSeats
    } else {
      seatNumbers = reserveSeats(seatCount, data.selectedPackage) || undefined
    }
    status = 'confirmed'
  }
  
  const newParticipant: Participant = {
    ...data,
    id: uuidv4(),
    registrationDate: now,
    lastUpdated: now,
    status,
    seatNumbers,
    receiptNumber: data.paymentStatus === 'paid' ? generateReceiptNumber() : undefined,
  }
  
  participants.push(newParticipant)
  setStorage(STORAGE_KEYS.participants, participants)
  
  const notificationType = newParticipant.status === 'waitlist' ? 'waitlist_added' : 'registration_confirmation'
  sendNotification(newParticipant.email, newParticipant.fullName, notificationType, newParticipant.id, {
    selectedPackage: newParticipant.selectedPackage,
    seatNumbers: newParticipant.seatNumbers,
    receiptNumber: newParticipant.receiptNumber,
    totalAmount: newParticipant.totalAmount,
    paymentMethod: newParticipant.paymentMethod,
  })

  return newParticipant
}

export function updateParticipant(id: string, data: Partial<Participant>): Participant | null {
  const participants = getParticipants()
  const index = participants.findIndex((p) => p.id === id)
  if (index === -1) return null

  const current = participants[index]
  const becamePaid = data.paymentStatus === 'paid' && current.paymentStatus !== 'paid'

  let seatNumbers = data.seatNumbers ?? current.seatNumbers
  if (becamePaid && !seatNumbers) {
    const seatCount = current.groupSeats ?? 1
    seatNumbers = reserveSeats(seatCount, current.selectedPackage) || undefined
  }

  const updated: Participant = {
    ...current,
    ...data,
    seatNumbers,
    receiptNumber: becamePaid && !current.receiptNumber ? generateReceiptNumber() : (data.receiptNumber ?? current.receiptNumber),
    lastUpdated: new Date().toISOString(),
  }
  participants[index] = updated
  setStorage(STORAGE_KEYS.participants, participants)

  // When admin approves payment: upsert account with a fresh temp password
  // upsertUserAccount always updates both password and participantId, covering
  // re-registrations where the same email was used after a prior cancellation.
  if (becamePaid) {
    const loginPassword = generateTempPassword()
    upsertUserAccount(updated.email, loginPassword, updated.id)
    sendNotification(updated.email, updated.fullName, 'seat_confirmed', updated.id, {
      selectedPackage: updated.selectedPackage,
      seatNumbers: updated.seatNumbers,
      receiptNumber: updated.receiptNumber,
      totalAmount: updated.totalAmount,
      paymentMethod: updated.paymentMethod,
      loginEmail: updated.email,
      loginPassword,
    })
  }

  return updated
}

export function declineParticipant(id: string, reason?: string): Participant | null {
  const updated = updateParticipant(id, { status: 'cancelled' })
  if (!updated) return null
  sendNotification(updated.email, updated.fullName, 'payment_declined', updated.id, {
    declineReason: reason,
  })
  return updated
}

export function deleteParticipant(id: string): boolean {
  const participants = getParticipants()
  const filtered = participants.filter((p) => p.id !== id)
  if (filtered.length === participants.length) return false
  setStorage(STORAGE_KEYS.participants, filtered)
  // Clean up linked user account so stale login sessions can't persist
  deleteUserAccountByParticipantId(id)
  return true
}

// ==================== GROUP REGISTRATION ====================

export function getGroupRegistrations(): GroupRegistration[] {
  return getStorage<GroupRegistration[]>(STORAGE_KEYS.groups, [])
}

export function createGroupRegistration(
  data: Omit<GroupRegistration, 'id' | 'registrationDate' | 'lastUpdated'>
): GroupRegistration {
  const groups = getGroupRegistrations()
  const now = new Date().toISOString()
  
  const newGroup: GroupRegistration = {
    ...data,
    id: uuidv4(),
    registrationDate: now,
    lastUpdated: now,
  }
  groups.push(newGroup)
  setStorage(STORAGE_KEYS.groups, groups)
  return newGroup
}

export function updateGroupRegistration(id: string, data: Partial<GroupRegistration>): GroupRegistration | null {
  const groups = getGroupRegistrations()
  const index = groups.findIndex(g => g.id === id)
  if (index === -1) return null
  
  groups[index] = { ...groups[index], ...data, lastUpdated: new Date().toISOString() }
  setStorage(STORAGE_KEYS.groups, groups)
  return groups[index]
}

export function deleteGroupRegistration(id: string): boolean {
  const groups = getGroupRegistrations()
  const group = groups.find(g => g.id === id)
  if (!group) return false
  
  group.participants.forEach(pId => deleteParticipant(pId))
  
  const filtered = groups.filter(g => g.id !== id)
  setStorage(STORAGE_KEYS.groups, filtered)
  return true
}

// ==================== STATISTICS ====================

export function getStatistics() {
  const participants = getParticipants()
  const groups = getGroupRegistrations()
  const config = getSeatConfiguration()
  const transactions = getTransactions()
  
  const totalRegistrations = participants.length
  const confirmedRegistrations = participants.filter((p) => p.status === 'confirmed').length
  const pendingRegistrations = participants.filter((p) => p.status === 'pending').length
  const cancelledRegistrations = participants.filter((p) => p.status === 'cancelled').length
  const waitlistCount = participants.filter((p) => p.status === 'waitlist').length
  
  const totalRevenue = participants.reduce((sum, p) => sum + p.amountPaid, 0)
  const expectedRevenue = participants.reduce((sum, p) => sum + p.totalAmount, 0)
  const paidParticipants = participants.filter((p) => p.paymentStatus === 'paid').length
  const partialPayments = participants.filter((p) => p.paymentStatus === 'partial').length
  const unpaidParticipants = participants.filter((p) => p.paymentStatus === 'unpaid').length
  
  const packageDistribution: Record<string, number> = {}
  for (const pkg of getAllPackages()) {
    packageDistribution[pkg.id] = participants.filter(p => p.selectedPackage === pkg.id).length
  }
  
  const paymentMethodStats = {
    mpesa: transactions.filter(t => t.paymentMethod === 'mpesa' && t.status === 'completed').length,
    tigopesa: transactions.filter(t => t.paymentMethod === 'tigopesa' && t.status === 'completed').length,
    airtel: transactions.filter(t => t.paymentMethod === 'airtel' && t.status === 'completed').length,
    halopesa: transactions.filter(t => t.paymentMethod === 'halopesa' && t.status === 'completed').length,
    card: transactions.filter(t => ['visa', 'mastercard'].includes(t.paymentMethod) && t.status === 'completed').length,
    bank: transactions.filter(t => t.paymentMethod === 'bank-transfer' && t.status === 'completed').length,
  }
  
  const groupStats = {
    totalGroups: groups.length,
    totalGroupSeats: groups.reduce((sum, g) => sum + g.totalSeats, 0),
    groupRevenue: groups.reduce((sum, g) => sum + g.amountPaid, 0),
  }

  return {
    totalRegistrations,
    confirmedRegistrations,
    pendingRegistrations,
    cancelledRegistrations,
    waitlistCount,
    totalRevenue,
    expectedRevenue,
    paidParticipants,
    partialPayments,
    unpaidParticipants,
    packageDistribution,
    paymentMethodStats,
    groupStats,
    seatConfiguration: config,
  }
}

// ==================== SEARCH AND FILTER ====================

export function searchParticipants(
  query: string,
  filters: {
    status?: string
    paymentStatus?: string
    package?: string
    bookingType?: string
  } = {}
): Participant[] {
  let participants = getParticipants()
  
  if (query) {
    const lowerQuery = query.toLowerCase()
    participants = participants.filter(
      (p) =>
        p.fullName.toLowerCase().includes(lowerQuery) ||
        p.email.toLowerCase().includes(lowerQuery) ||
        p.phoneNumber.includes(query) ||
        p.city.toLowerCase().includes(lowerQuery) ||
        p.organizationName?.toLowerCase().includes(lowerQuery) ||
        p.receiptNumber?.toLowerCase().includes(lowerQuery)
    )
  }
  
  if (filters.status && filters.status !== 'all') {
    participants = participants.filter((p) => p.status === filters.status)
  }
  
  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    participants = participants.filter((p) => p.paymentStatus === filters.paymentStatus)
  }
  
  if (filters.package && filters.package !== 'all') {
    participants = participants.filter((p) => p.selectedPackage === filters.package)
  }
  
  if (filters.bookingType && filters.bookingType !== 'all') {
    participants = participants.filter((p) => p.bookingType === filters.bookingType)
  }
  
  return participants
}

// ==================== EXPORT ====================

export function exportToCSV(): string {
  const participants = getParticipants()
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'WhatsApp',
    'City',
    'Organization',
    'Business Type',
    'Occupation',
    'Package',
    'Total Amount',
    'Amount Paid',
    'Payment Status',
    'Registration Status',
    'Registration Date',
    'Receipt Number',
  ]
  
  const rows = participants.map((p) => [
    p.fullName,
    p.email,
    p.phoneNumber,
    p.whatsappNumber,
    p.city,
    p.organizationName || '',
    p.businessType,
    p.occupation,
    p.selectedPackage,
    p.totalAmount.toString(),
    p.amountPaid.toString(),
    p.paymentStatus,
    p.status,
    new Date(p.registrationDate).toLocaleDateString(),
    p.receiptNumber || '',
  ])
  
  const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
  return csv
}

// ==================== SPONSORSHIP ====================

export function getSponsorshipSettings(): SponsorshipPageSettings {
  return getStorage<SponsorshipPageSettings>(STORAGE_KEYS.sponsorshipSettings, DEFAULT_SPONSORSHIP_SETTINGS)
}

export function updateSponsorshipSettings(data: Partial<SponsorshipPageSettings>): SponsorshipPageSettings {
  const current = getSponsorshipSettings()
  const updated = { ...current, ...data }
  setStorage(STORAGE_KEYS.sponsorshipSettings, updated)
  return updated
}

export function getSponsorshipTiers(): SponsorshipTier[] {
  const stored = getStorage<SponsorshipTier[]>(STORAGE_KEYS.sponsorshipTiers, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.sponsorshipTiers, DEFAULT_SPONSORSHIP_TIERS)
    return DEFAULT_SPONSORSHIP_TIERS
  }
  return stored.filter(t => t.active).sort((a, b) => a.order - b.order)
}

export function getAllSponsorshipTiers(): SponsorshipTier[] {
  const stored = getStorage<SponsorshipTier[]>(STORAGE_KEYS.sponsorshipTiers, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.sponsorshipTiers, DEFAULT_SPONSORSHIP_TIERS)
    return DEFAULT_SPONSORSHIP_TIERS
  }
  return stored.sort((a, b) => a.order - b.order)
}

export function createSponsorshipTier(data: Omit<SponsorshipTier, 'id'>): SponsorshipTier {
  const tiers = getAllSponsorshipTiers()
  const tier: SponsorshipTier = { ...data, id: uuidv4() }
  tiers.push(tier)
  setStorage(STORAGE_KEYS.sponsorshipTiers, tiers)
  return tier
}

export function updateSponsorshipTier(id: string, data: Partial<SponsorshipTier>): SponsorshipTier | null {
  const tiers = getAllSponsorshipTiers()
  const idx = tiers.findIndex(t => t.id === id)
  if (idx === -1) return null
  tiers[idx] = { ...tiers[idx], ...data }
  setStorage(STORAGE_KEYS.sponsorshipTiers, tiers)
  return tiers[idx]
}

export function deleteSponsorshipTier(id: string): boolean {
  const tiers = getAllSponsorshipTiers()
  const filtered = tiers.filter(t => t.id !== id)
  if (filtered.length === tiers.length) return false
  setStorage(STORAGE_KEYS.sponsorshipTiers, filtered)
  return true
}

export function getSponsors(): Sponsor[] {
  const stored = getStorage<Sponsor[]>(STORAGE_KEYS.sponsors, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.sponsors, DEFAULT_SPONSORS)
    return DEFAULT_SPONSORS.filter(s => s.active)
  }
  return stored.filter(s => s.active)
}

export function getAllSponsors(): Sponsor[] {
  const stored = getStorage<Sponsor[]>(STORAGE_KEYS.sponsors, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.sponsors, DEFAULT_SPONSORS)
    return DEFAULT_SPONSORS
  }
  return stored
}

export function createSponsor(data: Omit<Sponsor, 'id'>): Sponsor {
  const sponsors = getAllSponsors()
  const sponsor: Sponsor = { ...data, id: uuidv4() }
  sponsors.push(sponsor)
  setStorage(STORAGE_KEYS.sponsors, sponsors)
  return sponsor
}

export function updateSponsor(id: string, data: Partial<Sponsor>): Sponsor | null {
  const sponsors = getAllSponsors()
  const idx = sponsors.findIndex(s => s.id === id)
  if (idx === -1) return null
  sponsors[idx] = { ...sponsors[idx], ...data }
  setStorage(STORAGE_KEYS.sponsors, sponsors)
  return sponsors[idx]
}

export function deleteSponsor(id: string): boolean {
  const sponsors = getAllSponsors()
  const filtered = sponsors.filter(s => s.id !== id)
  if (filtered.length === sponsors.length) return false
  setStorage(STORAGE_KEYS.sponsors, filtered)
  return true
}

// ==================== SPONSORSHIP APPLICATIONS ====================

export function getSponsorshipApplications(): SponsorshipApplication[] {
  return getStorage<SponsorshipApplication[]>(STORAGE_KEYS.sponsorshipApplications, [])
}

export function createSponsorshipApplication(
  data: Omit<SponsorshipApplication, 'id' | 'invoiceNumber' | 'submittedAt' | 'status' | 'paymentStatus'>
): SponsorshipApplication {
  const apps = getSponsorshipApplications()
  const seq = (apps.length + 1).toString().padStart(4, '0')
  const year = new Date().getFullYear()
  const app: SponsorshipApplication = {
    ...data,
    id: uuidv4(),
    invoiceNumber: `SPO-${year}-${seq}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    paymentStatus: 'unpaid',
  }
  apps.push(app)
  setStorage(STORAGE_KEYS.sponsorshipApplications, apps)
  return app
}

export function updateSponsorshipApplication(id: string, data: Partial<SponsorshipApplication>): SponsorshipApplication | null {
  const apps = getSponsorshipApplications()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx] = { ...apps[idx], ...data }
  setStorage(STORAGE_KEYS.sponsorshipApplications, apps)
  return apps[idx]
}

export function deleteSponsorshipApplication(id: string): boolean {
  const apps = getSponsorshipApplications()
  const filtered = apps.filter(a => a.id !== id)
  if (filtered.length === apps.length) return false
  setStorage(STORAGE_KEYS.sponsorshipApplications, filtered)
  return true
}

// ==================== ACADEMIC PARTNERS ====================

export function getAcademicPartners(): AcademicPartner[] {
  const stored = getStorage<AcademicPartner[]>(STORAGE_KEYS.academicPartners, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.academicPartners, DEFAULT_ACADEMIC_PARTNERS)
    return DEFAULT_ACADEMIC_PARTNERS.filter(p => p.active)
  }
  return stored.filter(p => p.active)
}

export function getAllAcademicPartners(): AcademicPartner[] {
  const stored = getStorage<AcademicPartner[]>(STORAGE_KEYS.academicPartners, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.academicPartners, DEFAULT_ACADEMIC_PARTNERS)
    return DEFAULT_ACADEMIC_PARTNERS
  }
  return stored
}

export function createAcademicPartner(data: Omit<AcademicPartner, 'id'>): AcademicPartner {
  const partners = getAllAcademicPartners()
  const partner: AcademicPartner = { ...data, id: uuidv4() }
  partners.push(partner)
  setStorage(STORAGE_KEYS.academicPartners, partners)
  return partner
}

export function updateAcademicPartner(id: string, data: Partial<AcademicPartner>): AcademicPartner | null {
  const partners = getAllAcademicPartners()
  const idx = partners.findIndex(p => p.id === id)
  if (idx === -1) return null
  partners[idx] = { ...partners[idx], ...data }
  setStorage(STORAGE_KEYS.academicPartners, partners)
  return partners[idx]
}

export function getAcademicPartnerSettings(): AcademicPartnerSettings {
  return getStorage<AcademicPartnerSettings>(STORAGE_KEYS.academicPartnerSettings, DEFAULT_ACADEMIC_PARTNER_SETTINGS)
}

export function updateAcademicPartnerSettings(data: Partial<AcademicPartnerSettings>): AcademicPartnerSettings {
  const current = getAcademicPartnerSettings()
  const updated = { ...current, ...data }
  setStorage(STORAGE_KEYS.academicPartnerSettings, updated)
  return updated
}

export function deleteAcademicPartner(id: string): boolean {
  const partners = getAllAcademicPartners()
  const filtered = partners.filter(p => p.id !== id)
  if (filtered.length === partners.length) return false
  setStorage(STORAGE_KEYS.academicPartners, filtered)
  return true
}

// ==================== RESET DATA ====================

export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  })
}

// ==================== ADMIN CREDENTIAL ====================

const DEFAULT_ADMIN_PASSWORD = 'admin123'

export function getAdminCredential(): AdminCredential {
  const stored = getStorage<AdminCredential | null>(STORAGE_KEYS.adminCredential, null)
  // Only use stored credential if it has a valid non-empty passwordHash
  if (stored && stored.email && stored.passwordHash) return stored
  // Seed default (covers first run and cases where stored hash is empty/corrupt)
  const cred: AdminCredential = { email: DEFAULT_ADMIN_CREDENTIAL.email, passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD) }
  seedIfReady(STORAGE_KEYS.adminCredential, cred)
  return cred
}

export function updateAdminCredential(email: string, password: string): void {
  setStorage(STORAGE_KEYS.adminCredential, { email: email.toLowerCase(), passwordHash: hashPassword(password) })
}

export function updateAdminEmail(email: string): void {
  const cred = getAdminCredential()
  setStorage(STORAGE_KEYS.adminCredential, { ...cred, email: email.toLowerCase() })
}

export function loginAdmin(email: string, password: string): boolean {
  const cred = getAdminCredential()
  if (cred.email !== email.toLowerCase()) return false
  if (cred.passwordHash !== hashPassword(password)) return false
  setStorage(STORAGE_KEYS.currentAdmin, { email: cred.email, loggedInAt: new Date().toISOString() })
  return true
}

export function getCurrentAdmin(): AdminSession | null {
  return getStorage<AdminSession | null>(STORAGE_KEYS.currentAdmin, null)
}

export function updateCurrentAdminName(name: string): void {
  const session = getCurrentAdmin()
  if (!session) return
  setStorage(STORAGE_KEYS.currentAdmin, { ...session, name })
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.currentAdmin)
  }
}

// ==================== UNIFIED LOGIN ====================

export type LoginResult =
  | { role: 'admin'; email: string }
  | { role: 'trainer'; account: TrainerAccount }
  | { role: 'participant'; account: UserAccount }
  | null

export function loginUnified(email: string, password: string): LoginResult {
  const lowerEmail = email.toLowerCase().trim()
  const hashedPassword = hashPassword(password)

  // 1. Check primary admin (super admin)
  const cred = getAdminCredential()
  if (cred.email.toLowerCase() === lowerEmail && cred.passwordHash === hashedPassword) {
    const profile = getAdminProfile()
    const session: AdminSession = {
      email: lowerEmail,
      name: profile.name || 'Admin',
      roleId: 'super-admin',
      isSuperAdmin: true,
      loggedInAt: new Date().toISOString(),
    }
    setStorage(STORAGE_KEYS.currentAdmin, session)
    return { role: 'admin', email: lowerEmail }
  }

  // 1.5. Check sub-admin users
  const subAdmins = getSubAdmins()
  const subAdmin = subAdmins.find(u => u.email.toLowerCase() === lowerEmail && u.active)
  if (subAdmin && subAdmin.passwordHash === hashedPassword) {
    updateSubAdmin(subAdmin.id, { lastLoginAt: new Date().toISOString() })
    const session: AdminSession = {
      email: lowerEmail,
      name: subAdmin.name,
      roleId: subAdmin.roleId,
      isSuperAdmin: false,
      loggedInAt: new Date().toISOString(),
    }
    setStorage(STORAGE_KEYS.currentAdmin, session)
    return { role: 'admin', email: lowerEmail }
  }

  // 2. Check trainer (case-insensitive email comparison)
  const trainerAccounts = getAllTrainerAccounts()
  const trainerAcc = trainerAccounts.find(a => a.email.toLowerCase() === lowerEmail)
  if (trainerAcc && trainerAcc.passwordHash === hashedPassword) {
    const idx = trainerAccounts.indexOf(trainerAcc)
    trainerAccounts[idx] = { ...trainerAcc, lastLogin: new Date().toISOString() }
    setStorage(STORAGE_KEYS.trainerAccounts, trainerAccounts)
    setStorage(STORAGE_KEYS.currentTrainer, trainerAccounts[idx])
    return { role: 'trainer', account: trainerAccounts[idx] }
  }

  // 3. Check participant (case-insensitive email comparison)
  const participantAccounts = getStorage<UserAccount[]>(STORAGE_KEYS.userAccounts, [])
  const participantAcc = participantAccounts.find(a => a.email.toLowerCase() === lowerEmail)
  if (participantAcc && participantAcc.passwordHash === hashedPassword) {
    const idx = participantAccounts.indexOf(participantAcc)
    participantAccounts[idx] = { ...participantAcc, lastLogin: new Date().toISOString() }
    setStorage(STORAGE_KEYS.userAccounts, participantAccounts)
    setStorage(STORAGE_KEYS.currentUser, participantAccounts[idx])
    return { role: 'participant', account: participantAccounts[idx] }
  }

  return null
}

export function logoutAll(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.currentAdmin)
    localStorage.removeItem(STORAGE_KEYS.currentTrainer)
    localStorage.removeItem(STORAGE_KEYS.currentUser)
  }
}

export function getCurrentRole(): { role: UserRole; label: string; email: string } | null {
  const admin = getStorage<{ email: string } | null>(STORAGE_KEYS.currentAdmin, null)
  if (admin) return { role: 'admin', label: 'Admin', email: admin.email }
  const trainer = getStorage<TrainerAccount | null>(STORAGE_KEYS.currentTrainer, null)
  if (trainer) return { role: 'trainer', label: 'Trainer', email: trainer.email }
  const participant = getStorage<UserAccount | null>(STORAGE_KEYS.currentUser, null)
  if (participant) return { role: 'participant', label: 'Participant', email: participant.email }
  return null
}



export function getAllTrainerAccounts(): TrainerAccount[] {
  return getStorage<TrainerAccount[]>(STORAGE_KEYS.trainerAccounts, [])
}

export function createTrainerAccount(trainerId: string, email: string, password: string): TrainerAccount | null {
  const accounts = getAllTrainerAccounts()
  const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase())
  if (existing && existing.trainerId !== trainerId) return null
  const account: TrainerAccount = {
    id: uuidv4(),
    trainerId,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  setStorage(STORAGE_KEYS.trainerAccounts, accounts)
  return account
}

export function updateTrainerAccount(id: string, data: Partial<Omit<TrainerAccount, 'id'>>): TrainerAccount | null {
  const accounts = getAllTrainerAccounts()
  const idx = accounts.findIndex(a => a.id === id)
  if (idx === -1) return null
  if (data.passwordHash) {
    // raw password passed — hash it
    data = { ...data, passwordHash: hashPassword(data.passwordHash) }
  }
  accounts[idx] = { ...accounts[idx], ...data }
  setStorage(STORAGE_KEYS.trainerAccounts, accounts)
  return accounts[idx]
}

export function deleteTrainerAccount(id: string): boolean {
  const accounts = getAllTrainerAccounts()
  const filtered = accounts.filter(a => a.id !== id)
  if (filtered.length === accounts.length) return false
  setStorage(STORAGE_KEYS.trainerAccounts, filtered)
  return true
}

export function loginTrainer(email: string, password: string): TrainerAccount | null {
  const accounts = getAllTrainerAccounts()
  const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase())
  if (!account) return null
  if (account.passwordHash !== hashPassword(password)) return null
  const idx = accounts.indexOf(account)
  accounts[idx] = { ...account, lastLogin: new Date().toISOString() }
  setStorage(STORAGE_KEYS.trainerAccounts, accounts)
  setStorage(STORAGE_KEYS.currentTrainer, accounts[idx])
  return accounts[idx]
}

export function getCurrentTrainer(): TrainerAccount | null {
  return getStorage<TrainerAccount | null>(STORAGE_KEYS.currentTrainer, null)
}

export function logoutTrainer(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.currentTrainer)
  }
}

// ==================== TRAINER MATERIALS ====================

export function getTrainerMaterials(trainerId?: string): TrainerMaterial[] {
  const all = getStorage<TrainerMaterial[]>(STORAGE_KEYS.trainerMaterials, [])
  const active = all.filter(m => m.active)
  return trainerId ? active.filter(m => m.trainerId === trainerId) : active
}

export function getAllTrainerMaterials(trainerId?: string): TrainerMaterial[] {
  const all = getStorage<TrainerMaterial[]>(STORAGE_KEYS.trainerMaterials, [])
  return trainerId ? all.filter(m => m.trainerId === trainerId) : all
}

export function createTrainerMaterial(data: Omit<TrainerMaterial, 'id'>): TrainerMaterial {
  const all = getStorage<TrainerMaterial[]>(STORAGE_KEYS.trainerMaterials, [])
  const material: TrainerMaterial = { ...data, id: uuidv4() }
  all.push(material)
  setStorage(STORAGE_KEYS.trainerMaterials, all)
  return material
}

export function updateTrainerMaterial(id: string, data: Partial<TrainerMaterial>): TrainerMaterial | null {
  const all = getStorage<TrainerMaterial[]>(STORAGE_KEYS.trainerMaterials, [])
  const idx = all.findIndex(m => m.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...data }
  setStorage(STORAGE_KEYS.trainerMaterials, all)
  return all[idx]
}

export function deleteTrainerMaterial(id: string): boolean {
  const all = getStorage<TrainerMaterial[]>(STORAGE_KEYS.trainerMaterials, [])
  const filtered = all.filter(m => m.id !== id)
  if (filtered.length === all.length) return false
  setStorage(STORAGE_KEYS.trainerMaterials, filtered)
  return true
}

// ==================== TRAINER ANNOUNCEMENTS ====================

export function getTrainerAnnouncements(trainerId?: string): TrainerAnnouncement[] {
  const all = getStorage<TrainerAnnouncement[]>(STORAGE_KEYS.trainerAnnouncements, [])
  const active = all.filter(a => a.active)
  return trainerId ? active.filter(a => a.trainerId === trainerId) : active
}

export function getAllTrainerAnnouncements(trainerId?: string): TrainerAnnouncement[] {
  const all = getStorage<TrainerAnnouncement[]>(STORAGE_KEYS.trainerAnnouncements, [])
  return trainerId ? all.filter(a => a.trainerId === trainerId) : all
}

export function createTrainerAnnouncement(data: Omit<TrainerAnnouncement, 'id'>): TrainerAnnouncement {
  const all = getStorage<TrainerAnnouncement[]>(STORAGE_KEYS.trainerAnnouncements, [])
  const ann: TrainerAnnouncement = { ...data, id: uuidv4() }
  all.push(ann)
  setStorage(STORAGE_KEYS.trainerAnnouncements, all)
  return ann
}

export function deleteTrainerAnnouncement(id: string): boolean {
  const all = getStorage<TrainerAnnouncement[]>(STORAGE_KEYS.trainerAnnouncements, [])
  const filtered = all.filter(a => a.id !== id)
  if (filtered.length === all.length) return false
  setStorage(STORAGE_KEYS.trainerAnnouncements, filtered)
  return true
}

// ==================== ATTENDANCE ====================

export function getAttendance(trainerId?: string): AttendanceRecord[] {
  const all = getStorage<AttendanceRecord[]>(STORAGE_KEYS.attendance, [])
  return trainerId ? all.filter(r => r.trainerId === trainerId) : all
}

export function upsertAttendance(trainerId: string, participantId: string, session: string, date: string, present: boolean): AttendanceRecord {
  const all = getStorage<AttendanceRecord[]>(STORAGE_KEYS.attendance, [])
  const existing = all.find(r => r.trainerId === trainerId && r.participantId === participantId && r.session === session)
  if (existing) {
    existing.present = present
    existing.markedAt = new Date().toISOString()
    setStorage(STORAGE_KEYS.attendance, all)
    return existing
  }
  const record: AttendanceRecord = { id: uuidv4(), trainerId, participantId, session, date, present, markedAt: new Date().toISOString() }
  all.push(record)
  setStorage(STORAGE_KEYS.attendance, all)
  return record
}

// ==================== AUTH ====================

import { hashPassword } from './crypto'

export function createUserAccount(email: string, password: string, participantId: string): UserAccount {
  const accounts = getStorage<UserAccount[]>(STORAGE_KEYS.userAccounts, [])
  const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase())
  if (existing) return existing
  const account: UserAccount = {
    id: uuidv4(),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    participantId,
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  setStorage(STORAGE_KEYS.userAccounts, accounts)
  return account
}

export function loginUser(email: string, password: string): UserAccount | null {
  const accounts = getStorage<UserAccount[]>(STORAGE_KEYS.userAccounts, [])
  const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase())
  if (!account) return null
  if (account.passwordHash !== hashPassword(password)) return null
  // Update lastLogin
  const idx = accounts.indexOf(account)
  accounts[idx] = { ...account, lastLogin: new Date().toISOString() }
  setStorage(STORAGE_KEYS.userAccounts, accounts)
  // Persist session
  setStorage(STORAGE_KEYS.currentUser, accounts[idx])
  return accounts[idx]
}

export function getCurrentUser(): UserAccount | null {
  return getStorage<UserAccount | null>(STORAGE_KEYS.currentUser, null)
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.currentUser)
  }
}

export function getUserByParticipantId(participantId: string): UserAccount | null {
  const accounts = getStorage<UserAccount[]>(STORAGE_KEYS.userAccounts, [])
  return accounts.find(a => a.participantId === participantId) || null
}

export function resetUserAccountPassword(email: string, newPassword: string): boolean {
  const accounts = getStorage<UserAccount[]>(STORAGE_KEYS.userAccounts, [])
  const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase())
  if (idx === -1) return false
  accounts[idx] = { ...accounts[idx], passwordHash: hashPassword(newPassword) }
  setStorage(STORAGE_KEYS.userAccounts, accounts)
  return true
}

export function deleteUserAccountByParticipantId(participantId: string): boolean {
  const accounts = getStorage<UserAccount[]>(STORAGE_KEYS.userAccounts, [])
  const filtered = accounts.filter(a => a.participantId !== participantId)
  if (filtered.length === accounts.length) return false
  setStorage(STORAGE_KEYS.userAccounts, filtered)
  return true
}

// Always produces a working account: updates password AND participantId on existing email,
// creates fresh if email not found. Avoids the silent no-op in createUserAccount.
export function upsertUserAccount(email: string, password: string, participantId: string): UserAccount {
  const accounts = getStorage<UserAccount[]>(STORAGE_KEYS.userAccounts, [])
  const idx = accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase())
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], passwordHash: hashPassword(password), participantId }
    setStorage(STORAGE_KEYS.userAccounts, accounts)
    return accounts[idx]
  }
  const account: UserAccount = {
    id: uuidv4(),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    participantId,
    createdAt: new Date().toISOString(),
  }
  accounts.push(account)
  setStorage(STORAGE_KEYS.userAccounts, accounts)
  return account
}

// ==================== EVENT DOCUMENTS ====================

export function getDocuments(): EventDocument[] {
  const stored = getStorage<EventDocument[]>(STORAGE_KEYS.documents, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.documents, DEFAULT_DOCUMENTS)
    return DEFAULT_DOCUMENTS
  }
  return stored.filter(d => d.active).sort((a, b) => a.uploadedAt > b.uploadedAt ? -1 : 1)
}

export function getAllDocuments(): EventDocument[] {
  const stored = getStorage<EventDocument[]>(STORAGE_KEYS.documents, [])
  if (stored.length === 0) {
    seedIfReady(STORAGE_KEYS.documents, DEFAULT_DOCUMENTS)
    return DEFAULT_DOCUMENTS
  }
  return stored.sort((a, b) => a.uploadedAt > b.uploadedAt ? -1 : 1)
}

export function createDocument(data: Omit<EventDocument, 'id'>): EventDocument {
  const docs = getAllDocuments()
  const newDoc: EventDocument = { ...data, id: uuidv4() }
  docs.unshift(newDoc)
  setStorage(STORAGE_KEYS.documents, docs)
  return newDoc
}

export function updateDocument(id: string, data: Partial<EventDocument>): EventDocument | null {
  const docs = getAllDocuments()
  const idx = docs.findIndex(d => d.id === id)
  if (idx === -1) return null
  docs[idx] = { ...docs[idx], ...data }
  setStorage(STORAGE_KEYS.documents, docs)
  return docs[idx]
}

export function deleteDocument(id: string): boolean {
  const docs = getAllDocuments()
  const filtered = docs.filter(d => d.id !== id)
  if (filtered.length === docs.length) return false
  setStorage(STORAGE_KEYS.documents, filtered)
  return true
}

export function getDocumentsForParticipant(packageType: string): EventDocument[] {
  return getDocuments().filter(d => d.availableTo === 'all' || d.availableTo === packageType)
}

// ==================== ADMIN PROFILE ====================

export function getAdminProfile(): AdminProfile {
  return getStorage<AdminProfile>(STORAGE_KEYS.adminProfile, { name: 'Admin' })
}

export function setAdminProfile(data: Partial<AdminProfile>): void {
  const current = getAdminProfile()
  setStorage(STORAGE_KEYS.adminProfile, { ...current, ...data })
}

// ==================== ADMIN ROLES ====================

export function getAdminRoles(): AdminRole[] {
  const stored = getStorage<AdminRole[]>(STORAGE_KEYS.adminRoles, [])
  if (!stored.length) {
    seedIfReady(STORAGE_KEYS.adminRoles, DEFAULT_ADMIN_ROLES)
    return DEFAULT_ADMIN_ROLES
  }
  // Always ensure super-admin system role exists
  if (!stored.find(r => r.id === 'super-admin')) {
    stored.unshift(DEFAULT_ADMIN_ROLES[0])
    setStorage(STORAGE_KEYS.adminRoles, stored)
  }
  return stored
}

export function createAdminRole(data: Omit<AdminRole, 'id' | 'createdAt'>): AdminRole {
  const roles = getAdminRoles()
  const role: AdminRole = { ...data, id: uuidv4(), createdAt: new Date().toISOString() }
  roles.push(role)
  setStorage(STORAGE_KEYS.adminRoles, roles)
  return role
}

export function updateAdminRole(id: string, data: Partial<Omit<AdminRole, 'id' | 'isSystem' | 'createdAt'>>): AdminRole | null {
  const roles = getAdminRoles()
  const idx = roles.findIndex(r => r.id === id)
  if (idx === -1) return null
  roles[idx] = { ...roles[idx], ...data }
  setStorage(STORAGE_KEYS.adminRoles, roles)
  return roles[idx]
}

export function deleteAdminRole(id: string): boolean {
  const roles = getAdminRoles()
  const role = roles.find(r => r.id === id)
  if (!role || role.isSystem) return false
  setStorage(STORAGE_KEYS.adminRoles, roles.filter(r => r.id !== id))
  return true
}

// ==================== SUB-ADMIN USERS ====================
// Sub-admin list is kept in both memStore/Supabase (source of truth) AND
// localStorage (login-cache). The localStorage copy ensures login works even
// if the page is closed before the async Supabase sync finishes.

const SUB_ADMINS_LOCAL_KEY = 'masterclass_sub_admins_local'

function saveSubAdminsLocal(users: SubAdminUser[]): void {
  setLocalStorage(SUB_ADMINS_LOCAL_KEY, users)
}

export function getSubAdmins(): SubAdminUser[] {
  // memStore is populated from Supabase during initStore(); use it when available
  if (STORAGE_KEYS.subAdmins in memStore) {
    return memStore[STORAGE_KEYS.subAdmins] as SubAdminUser[]
  }
  // Fall back to localStorage backup (e.g. during login before initStore loads from Supabase,
  // or if the Supabase sync raced with a logout)
  return getLocalStorage<SubAdminUser[]>(SUB_ADMINS_LOCAL_KEY, [])
}

export function createSubAdmin(data: { name: string; email: string; password: string; roleId: string }): SubAdminUser {
  const users = getSubAdmins()
  if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('A user with this email already exists')
  }
  const user: SubAdminUser = {
    id: uuidv4(),
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: hashPassword(data.password),
    roleId: data.roleId,
    active: true,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  setStorage(STORAGE_KEYS.subAdmins, users)
  saveSubAdminsLocal(users)
  return user
}

export function updateSubAdmin(id: string, data: { name?: string; email?: string; roleId?: string; active?: boolean; lastLoginAt?: string; password?: string }): SubAdminUser | null {
  const users = getSubAdmins()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return null
  const { password, ...rest } = data
  const update: Partial<SubAdminUser> = { ...rest }
  if (password) update.passwordHash = hashPassword(password)
  if (rest.email) update.email = rest.email.toLowerCase()
  users[idx] = { ...users[idx], ...update }
  setStorage(STORAGE_KEYS.subAdmins, users)
  saveSubAdminsLocal(users)
  return users[idx]
}

export function deleteSubAdmin(id: string): boolean {
  const users = getSubAdmins()
  const filtered = users.filter(u => u.id !== id)
  if (filtered.length === users.length) return false
  setStorage(STORAGE_KEYS.subAdmins, filtered)
  saveSubAdminsLocal(filtered)
  return true
}

// Explicitly awaits the DB write for sub-admins (use after create/update/delete
// to guarantee data is persisted before the admin logs out or navigates away).
// Throws on error so callers can surface the failure to the user.
export async function flushSubAdmins(): Promise<void> {
  const users = getSubAdmins()
  const res = await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: STORAGE_KEYS.subAdmins, value: users }),
  })
  if (!res.ok) throw new Error('Failed to persist sub-admins')
  saveSubAdminsLocal(users)
}

// ==================== TERMS & CONDITIONS ====================

export function getTermsContent(): TermsContent {
  return getStorage<TermsContent>(STORAGE_KEYS.termsContent, DEFAULT_TERMS)
}

export function setTermsContent(data: Partial<TermsContent>): TermsContent {
  const current = getTermsContent()
  const updated = { ...current, ...data }
  setStorage(STORAGE_KEYS.termsContent, updated)
  return updated
}

// Explicitly awaits the DB write for terms content. Throws on error.
export async function flushTermsContent(): Promise<void> {
  const content = getTermsContent()
  const res = await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: STORAGE_KEYS.termsContent, value: content }),
  })
  if (!res.ok) throw new Error('Failed to persist terms content')
}

// Explicitly awaits the DB write for site settings. Throws on error.
export async function flushSiteSettings(): Promise<void> {
  const settings = getSiteSettings()
  const res = await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: STORAGE_KEYS.siteSettings, value: settings }),
  })
  if (!res.ok) throw new Error('Failed to persist site settings')
}

// Explicitly awaits the DB write for seat configuration. Throws on error.
export async function flushSeatConfiguration(): Promise<void> {
  const config = getStorage<unknown>(STORAGE_KEYS.seats, {})
  const res = await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: STORAGE_KEYS.seats, value: config }),
  })
  if (!res.ok) throw new Error('Failed to persist seat configuration')
}

export async function flushCurriculumModules(): Promise<void> {
  const modules = getAllCurriculum()
  const res = await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: STORAGE_KEYS.curriculum, value: modules }),
  })
  if (!res.ok) throw new Error('Failed to persist curriculum modules')
}

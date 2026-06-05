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
} from './types'
import { 
  DEFAULT_SEAT_CONFIG, 
  DEFAULT_COUPONS, 
  PACKAGES, 
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
} from './types'

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
}

// Helper to safely access localStorage
function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('Failed to save to localStorage')
  }
}

// Generate receipt number
function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `MC${year}${month}-${random}`
}

// Initial demo data
const DEMO_PARTICIPANTS: Participant[] = [
  {
    id: uuidv4(),
    fullName: 'John Mwangi',
    phoneNumber: '+255 712 345 678',
    whatsappNumber: '+255 712 345 678',
    email: 'john.mwangi@example.com',
    gender: 'male',
    city: 'Dar es Salaam',
    occupation: 'Marketing Officer',
    organizationName: 'TechCorp Tanzania',
    businessType: 'Technology',
    yearsOfExperience: 5,
    trainingInterests: ['social-media', 'ai-tools', 'automation'],
    bookingType: 'individual',
    selectedPackage: 'standard',
    paymentStatus: 'paid',
    amountPaid: 380000,
    totalAmount: 380000,
    paymentMethod: 'mpesa',
    paymentReference: 'MP123456789',
    status: 'confirmed',
    registrationDate: '2024-01-15T10:30:00Z',
    lastUpdated: '2024-01-15T14:20:00Z',
    seatNumbers: [15],
    receiptNumber: 'MC202401-A1B2C3',
  },
  {
    id: uuidv4(),
    fullName: 'Sarah Kimaro',
    phoneNumber: '+255 756 789 012',
    whatsappNumber: '+255 756 789 012',
    email: 'sarah.kimaro@example.com',
    gender: 'female',
    city: 'Arusha',
    occupation: 'Business Owner',
    organizationName: 'Kimaro Enterprises',
    businessType: 'Retail & E-commerce',
    yearsOfExperience: 8,
    trainingInterests: ['digital-marketing', 'lead-generation', 'business-development'],
    bookingType: 'individual',
    selectedPackage: 'corporate-vip',
    paymentStatus: 'partial',
    amountPaid: 325000,
    totalAmount: 650000,
    paymentMethod: 'bank-transfer',
    paymentReference: 'BT987654321',
    status: 'pending',
    registrationDate: '2024-01-16T09:15:00Z',
    lastUpdated: '2024-01-16T09:15:00Z',
    notes: 'Waiting for remaining payment',
  },
  {
    id: uuidv4(),
    fullName: 'Michael Ochieng',
    phoneNumber: '+255 784 567 890',
    whatsappNumber: '+255 784 567 890',
    email: 'michael.ochieng@example.com',
    gender: 'male',
    city: 'Mwanza',
    occupation: 'Content Creator',
    businessType: 'Media & Entertainment',
    yearsOfExperience: 3,
    trainingInterests: ['social-media', 'ai-tools', 'agency-growth'],
    bookingType: 'individual',
    selectedPackage: 'early-bird',
    paymentStatus: 'paid',
    amountPaid: 250000,
    totalAmount: 250000,
    paymentMethod: 'tigopesa',
    paymentReference: 'TP456789123',
    status: 'confirmed',
    registrationDate: '2024-01-17T11:45:00Z',
    lastUpdated: '2024-01-17T12:00:00Z',
    seatNumbers: [22],
    receiptNumber: 'MC202401-D4E5F6',
  },
]

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
    setStorage(STORAGE_KEYS.heroSlides, DEFAULT_HERO_SLIDES)
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
    setStorage(STORAGE_KEYS.trainers, DEFAULT_TRAINERS)
    return DEFAULT_TRAINERS
  }
  return stored.filter(t => t.active).sort((a, b) => a.order - b.order)
}

export function getAllTrainers(): Trainer[] {
  const stored = getStorage<Trainer[]>(STORAGE_KEYS.trainers, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.trainers, DEFAULT_TRAINERS)
    return DEFAULT_TRAINERS
  }
  return stored.sort((a, b) => a.order - b.order)
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
  return true
}

// ==================== CURRICULUM ====================

export function getCurriculum(): CurriculumModule[] {
  const stored = getStorage<CurriculumModule[]>(STORAGE_KEYS.curriculum, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.curriculum, DEFAULT_CURRICULUM)
    return DEFAULT_CURRICULUM
  }
  return stored.filter(m => m.active).sort((a, b) => a.order - b.order)
}

export function getAllCurriculum(): CurriculumModule[] {
  const stored = getStorage<CurriculumModule[]>(STORAGE_KEYS.curriculum, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.curriculum, DEFAULT_CURRICULUM)
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
    setStorage(STORAGE_KEYS.faqs, DEFAULT_FAQS)
    return DEFAULT_FAQS
  }
  return stored.filter(f => f.active).sort((a, b) => a.order - b.order)
}

export function getAllFAQs(): FAQ[] {
  const stored = getStorage<FAQ[]>(STORAGE_KEYS.faqs, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.faqs, DEFAULT_FAQS)
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
    setStorage(STORAGE_KEYS.testimonials, DEFAULT_TESTIMONIALS)
    return DEFAULT_TESTIMONIALS
  }
  return stored.filter(t => t.active).sort((a, b) => a.order - b.order)
}

export function getAllTestimonials(): Testimonial[] {
  const stored = getStorage<Testimonial[]>(STORAGE_KEYS.testimonials, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.testimonials, DEFAULT_TESTIMONIALS)
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
    setStorage(STORAGE_KEYS.chatbotQA, DEFAULT_CHATBOT_QA)
    return DEFAULT_CHATBOT_QA
  }
  return stored.filter(q => q.active).sort((a, b) => a.order - b.order)
}

export function getAllChatbotQA(): ChatbotQA[] {
  const stored = getStorage<ChatbotQA[]>(STORAGE_KEYS.chatbotQA, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.chatbotQA, DEFAULT_CHATBOT_QA)
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
    setStorage(STORAGE_KEYS.companyStats, DEFAULT_COMPANY_STATS)
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
  const stored = getStorage<Package[]>(STORAGE_KEYS.packages, [])
  if (stored.length === 0) {
    const packagesWithActive = PACKAGES.map(p => ({ ...p, active: true }))
    setStorage(STORAGE_KEYS.packages, packagesWithActive)
    return packagesWithActive
  }
  return stored.filter(p => p.active)
}

export function getAllPackages(): Package[] {
  const stored = getStorage<Package[]>(STORAGE_KEYS.packages, [])
  if (stored.length === 0) {
    const packagesWithActive = PACKAGES.map(p => ({ ...p, active: true }))
    setStorage(STORAGE_KEYS.packages, packagesWithActive)
    return packagesWithActive
  }
  return stored
}

export function updatePackage(id: PackageType, data: Partial<Package>): Package | null {
  const packages = getAllPackages()
  const index = packages.findIndex(p => p.id === id)
  if (index === -1) return null
  packages[index] = { ...packages[index], ...data }
  setStorage(STORAGE_KEYS.packages, packages)
  return packages[index]
}

// ==================== PAYMENT METHODS ====================

export function getPaymentMethods(): PaymentMethodConfig[] {
  const stored = getStorage<PaymentMethodConfig[]>(STORAGE_KEYS.paymentMethods, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.paymentMethods, PAYMENT_METHODS_CONFIG)
    return PAYMENT_METHODS_CONFIG
  }
  return stored.filter(p => p.active)
}

export function getAllPaymentMethods(): PaymentMethodConfig[] {
  const stored = getStorage<PaymentMethodConfig[]>(STORAGE_KEYS.paymentMethods, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.paymentMethods, PAYMENT_METHODS_CONFIG)
    return PAYMENT_METHODS_CONFIG
  }
  return stored
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
  const stored = getStorage<SeatConfiguration>(STORAGE_KEYS.seats, DEFAULT_SEAT_CONFIG)
  const participants = getParticipants()
  
  const confirmedSeats = participants.filter(p => p.status === 'confirmed').length
  const reservedSeats = participants.filter(p => p.status === 'pending').length
  const waitlistCount = getWaitlist().length
  
  return {
    ...stored,
    confirmedSeats,
    reservedSeats,
    availableSeats: stored.totalSeats - confirmedSeats - reservedSeats,
    waitlistCount,
  }
}

export function updateTotalSeats(totalSeats: number): SeatConfiguration {
  const config = getSeatConfiguration()
  const newConfig = { ...config, totalSeats }
  newConfig.availableSeats = totalSeats - config.confirmedSeats - config.reservedSeats
  setStorage(STORAGE_KEYS.seats, newConfig)
  return newConfig
}

export function reserveSeats(count: number): number[] | null {
  const config = getSeatConfiguration()
  if (config.availableSeats < count) return null
  
  const participants = getParticipants()
  const takenSeats = new Set(participants.flatMap(p => p.seatNumbers || []))
  
  const assignedSeats: number[] = []
  for (let i = 1; i <= config.totalSeats && assignedSeats.length < count; i++) {
    if (!takenSeats.has(i)) {
      assignedSeats.push(i)
    }
  }
  
  return assignedSeats.length === count ? assignedSeats : null
}

// ==================== COUPON MANAGEMENT ====================

export function getCoupons(): CouponCode[] {
  const stored = getStorage<CouponCode[]>(STORAGE_KEYS.coupons, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.coupons, DEFAULT_COUPONS)
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
            seatNumbers: newStatus === 'confirmed' ? reserveSeats(1) || undefined : undefined,
            receiptNumber: newPaymentStatus === 'paid' ? generateReceiptNumber() : undefined,
          })
          
          if (newPaymentStatus === 'paid') {
            sendNotification(participant.email, participant.fullName, 'payment_received', participantId)
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
  participantId?: string
): EmailNotification {
  const notifications = getNotifications()
  
  const subjects: Record<NotificationType, string> = {
    registration_confirmation: 'Registration Confirmed - Executive Masterclass',
    payment_received: 'Payment Received - Executive Masterclass',
    payment_reminder: 'Payment Reminder - Executive Masterclass',
    seat_confirmed: 'Your Seat is Confirmed - Executive Masterclass',
    waitlist_added: 'Added to Waitlist - Executive Masterclass',
    waitlist_available: 'Seats Available! - Executive Masterclass',
    event_reminder: 'Event Reminder - Executive Masterclass',
    receipt: 'Payment Receipt - Executive Masterclass',
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
  
  return notification
}

// ==================== PARTICIPANT CRUD ====================

export function getParticipants(): Participant[] {
  const stored = getStorage<Participant[]>(STORAGE_KEYS.participants, [])
  if (stored.length === 0) {
    setStorage(STORAGE_KEYS.participants, DEMO_PARTICIPANTS)
    return DEMO_PARTICIPANTS
  }
  return stored
}

export function getParticipantById(id: string): Participant | undefined {
  const participants = getParticipants()
  return participants.find((p) => p.id === id)
}

export function createParticipant(
  data: Omit<Participant, 'id' | 'registrationDate' | 'lastUpdated' | 'receiptNumber' | 'seatNumbers'>
): Participant {
  const participants = getParticipants()
  const config = getSeatConfiguration()
  const now = new Date().toISOString()
  
  let status = data.status
  let seatNumbers: number[] | undefined
  
  if (config.availableSeats <= 0) {
    status = 'waitlist'
  } else if (data.paymentStatus === 'paid') {
    seatNumbers = reserveSeats(1) || undefined
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
  
  sendNotification(newParticipant.email, newParticipant.fullName, 'registration_confirmation', newParticipant.id)
  
  return newParticipant
}

export function updateParticipant(id: string, data: Partial<Participant>): Participant | null {
  const participants = getParticipants()
  const index = participants.findIndex((p) => p.id === id)
  if (index === -1) return null

  const updated: Participant = {
    ...participants[index],
    ...data,
    lastUpdated: new Date().toISOString(),
  }
  participants[index] = updated
  setStorage(STORAGE_KEYS.participants, participants)
  return updated
}

export function deleteParticipant(id: string): boolean {
  const participants = getParticipants()
  const filtered = participants.filter((p) => p.id !== id)
  if (filtered.length === participants.length) return false
  setStorage(STORAGE_KEYS.participants, filtered)
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
  
  const packageDistribution = {
    'early-bird': participants.filter((p) => p.selectedPackage === 'early-bird').length,
    standard: participants.filter((p) => p.selectedPackage === 'standard').length,
    'corporate-vip': participants.filter((p) => p.selectedPackage === 'corporate-vip').length,
  }
  
  const paymentMethodStats = {
    mpesa: transactions.filter(t => t.paymentMethod === 'mpesa' && t.status === 'completed').length,
    tigopesa: transactions.filter(t => t.paymentMethod === 'tigopesa' && t.status === 'completed').length,
    airtel: transactions.filter(t => t.paymentMethod === 'airtel' && t.status === 'completed').length,
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

// ==================== RESET DATA ====================

export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  })
}

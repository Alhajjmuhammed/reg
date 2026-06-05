export type ParticipantStatus = 'pending' | 'confirmed' | 'cancelled' | 'waitlist'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'
export type PackageType = 'early-bird' | 'standard' | 'corporate-vip'
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say'
export type BookingType = 'individual' | 'group'
export type PaymentMethod = 'mpesa' | 'tigopesa' | 'airtel' | 'halopesa' | 'visa' | 'mastercard' | 'bank-transfer' | 'corporate-invoice'

// ==================== SITE CONFIGURATION ====================

export interface SiteSettings {
  // Event Details
  eventName: string
  eventTagline: string
  eventDescription: string
  eventDate: string
  eventEndDate: string
  eventTime: string
  eventVenue: string
  eventAddress: string
  eventCity: string
  eventCountry: string
  // Contact Information
  contactEmail: string
  contactPhone: string
  contactWhatsApp: string
  officeHours: string
  // Social Media
  socialFacebook?: string
  socialTwitter?: string
  socialInstagram?: string
  socialLinkedIn?: string
  socialYouTube?: string
  // Branding
  logoUrl?: string
  faviconUrl?: string
  primaryColor: string
  secondaryColor: string
  // Registration Settings
  registrationOpen: boolean
  registrationDeadline?: string
  maxGroupSize: number
  minGroupSize: number
  waitlistEnabled: boolean
  // Company Info
  companyName: string
  companyDescription: string
  companyMission: string
  companyVision: string
  foundedYear: number
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  eventName: 'Executive Masterclass',
  eventTagline: 'Transform Your Business with AI & Digital Marketing',
  eventDescription: 'A 3-day professional intensive training program on Social Media Management, Business Automation & AI Agents for entrepreneurs and business professionals.',
  eventDate: '2024-03-15',
  eventEndDate: '2024-03-17',
  eventTime: '08:00 AM - 05:00 PM',
  eventVenue: 'Julius Nyerere International Convention Centre',
  eventAddress: 'Shaaban Robert Street',
  eventCity: 'Dar es Salaam',
  eventCountry: 'Tanzania',
  contactEmail: 'info@executivemasterclass.co.tz',
  contactPhone: '+255 712 345 678',
  contactWhatsApp: '+255712345678',
  officeHours: 'Mon - Fri: 8:00 AM - 6:00 PM',
  socialFacebook: 'https://facebook.com/executivemasterclass',
  socialTwitter: 'https://twitter.com/execmasterclass',
  socialInstagram: 'https://instagram.com/executivemasterclass',
  socialLinkedIn: 'https://linkedin.com/company/executive-masterclass',
  socialYouTube: 'https://youtube.com/@executivemasterclass',
  primaryColor: '#14b8a6',
  secondaryColor: '#0d9488',
  registrationOpen: true,
  maxGroupSize: 10,
  minGroupSize: 2,
  waitlistEnabled: true,
  companyName: 'Executive Masterclass Tanzania',
  companyDescription: 'Leading provider of professional training and development programs in East Africa, specializing in digital marketing, business automation, and AI-powered solutions.',
  companyMission: 'To empower businesses and professionals with cutting-edge digital skills and AI technologies that drive growth and innovation.',
  companyVision: 'To be the leading professional training organization in Africa, transforming businesses through technology and innovation.',
  foundedYear: 2019,
}

// ==================== HERO SLIDES ====================

export interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  order: number
  active: boolean
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    title: 'Executive Masterclass 2024',
    subtitle: 'Transform Your Business',
    description: 'A 3-day intensive program on Social Media, Business Automation & AI Agents',
    imageUrl: '/images/hero-1.jpg',
    ctaText: 'Register Now',
    ctaLink: '#register',
    order: 1,
    active: true,
  },
  {
    id: 'slide-2',
    title: 'Master AI & Automation',
    subtitle: 'Future-Proof Your Skills',
    description: 'Learn to leverage cutting-edge AI tools and automation systems for business growth',
    imageUrl: '/images/hero-2.jpg',
    ctaText: 'View Curriculum',
    ctaLink: '#curriculum',
    order: 2,
    active: true,
  },
  {
    id: 'slide-3',
    title: 'Network with Leaders',
    subtitle: 'Connect & Collaborate',
    description: 'Join 100+ business professionals and entrepreneurs in this exclusive training',
    imageUrl: '/images/hero-3.jpg',
    ctaText: 'Meet Our Trainers',
    ctaLink: '#trainers',
    order: 3,
    active: true,
  },
]

// ==================== TRAINERS ====================

export interface Trainer {
  id: string
  name: string
  title: string
  bio: string
  photoUrl: string
  expertise: string[]
  stats: {
    trainees: number
    experience: number
    companies: number
  }
  social?: {
    linkedin?: string
    twitter?: string
    website?: string
  }
  order: number
  active: boolean
}

export const DEFAULT_TRAINERS: Trainer[] = [
  {
    id: 'trainer-1',
    name: 'Dr. James Mwakasege',
    title: 'AI & Automation Expert',
    bio: 'With over 15 years of experience in technology and business transformation, Dr. Mwakasege has trained over 5,000 professionals across East Africa in digital marketing and AI implementation.',
    photoUrl: '/images/trainer-1.jpg',
    expertise: ['Artificial Intelligence', 'Business Automation', 'Digital Strategy', 'Machine Learning'],
    stats: { trainees: 5000, experience: 15, companies: 200 },
    social: { linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
    order: 1,
    active: true,
  },
  {
    id: 'trainer-2',
    name: 'Sarah Kimaro',
    title: 'Digital Marketing Strategist',
    bio: 'Award-winning digital marketer with expertise in social media strategy, content marketing, and lead generation. Sarah has helped over 300 businesses scale their online presence.',
    photoUrl: '/images/trainer-2.jpg',
    expertise: ['Social Media Marketing', 'Content Strategy', 'Lead Generation', 'Brand Building'],
    stats: { trainees: 3500, experience: 10, companies: 300 },
    social: { linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
    order: 2,
    active: true,
  },
  {
    id: 'trainer-3',
    name: 'Michael Ochieng',
    title: 'Business Growth Consultant',
    bio: 'Serial entrepreneur and business consultant specializing in helping SMEs leverage technology for growth. Michael brings real-world experience from building multiple successful ventures.',
    photoUrl: '/images/trainer-3.jpg',
    expertise: ['Business Strategy', 'Sales Optimization', 'Agency Growth', 'E-commerce'],
    stats: { trainees: 2800, experience: 12, companies: 150 },
    social: { linkedin: 'https://linkedin.com', website: 'https://example.com' },
    order: 3,
    active: true,
  },
]

// ==================== CURRICULUM/MODULES ====================

export interface CurriculumModule {
  id: string
  title: string
  description: string
  icon: string
  topics: string[]
  outcomes: string[]
  duration: string
  day: number
  order: number
  active: boolean
}

export const DEFAULT_CURRICULUM: CurriculumModule[] = [
  {
    id: 'module-1',
    title: 'Social Media Mastery',
    description: 'Master the art of social media marketing and content creation for business growth.',
    icon: 'share-2',
    topics: ['Platform-specific strategies', 'Content calendar creation', 'Engagement tactics', 'Community building', 'Influencer partnerships'],
    outcomes: ['Create viral content strategies', 'Build engaged communities', 'Measure social ROI effectively'],
    duration: '4 hours',
    day: 1,
    order: 1,
    active: true,
  },
  {
    id: 'module-2',
    title: 'Business Automation',
    description: 'Streamline your operations with powerful automation tools and workflows.',
    icon: 'cog',
    topics: ['Workflow automation', 'CRM integration', 'Email sequences', 'Task automation', 'Process optimization'],
    outcomes: ['Automate repetitive tasks', 'Build efficient workflows', 'Scale operations effectively'],
    duration: '4 hours',
    day: 1,
    order: 2,
    active: true,
  },
  {
    id: 'module-3',
    title: 'AI Tools & ChatGPT',
    description: 'Leverage AI-powered tools for content creation, customer service, and productivity.',
    icon: 'brain',
    topics: ['ChatGPT for business', 'AI content creation', 'Automated responses', 'AI analytics', 'Prompt engineering'],
    outcomes: ['Create AI-powered content', 'Implement AI assistants', 'Boost productivity with AI'],
    duration: '5 hours',
    day: 2,
    order: 3,
    active: true,
  },
  {
    id: 'module-4',
    title: 'Lead Generation',
    description: 'Build effective lead generation systems that convert prospects into customers.',
    icon: 'users',
    topics: ['Lead magnets', 'Landing pages', 'Funnel building', 'Conversion optimization', 'Lead scoring'],
    outcomes: ['Build high-converting funnels', 'Generate qualified leads', 'Optimize conversion rates'],
    duration: '4 hours',
    day: 2,
    order: 4,
    active: true,
  },
  {
    id: 'module-5',
    title: 'Analytics & Reporting',
    description: 'Make data-driven decisions with powerful analytics and reporting tools.',
    icon: 'bar-chart-2',
    topics: ['Google Analytics', 'Social media insights', 'ROI tracking', 'Dashboard creation', 'Performance metrics'],
    outcomes: ['Track key metrics', 'Create insightful reports', 'Make data-driven decisions'],
    duration: '3 hours',
    day: 3,
    order: 5,
    active: true,
  },
  {
    id: 'module-6',
    title: 'Digital Strategy',
    description: 'Develop comprehensive digital strategies for sustainable business growth.',
    icon: 'target',
    topics: ['Strategic planning', 'Competitive analysis', 'Budget allocation', 'Growth hacking', 'Scaling strategies'],
    outcomes: ['Create winning strategies', 'Outperform competitors', 'Scale your business'],
    duration: '4 hours',
    day: 3,
    order: 6,
    active: true,
  },
]

// ==================== FAQ ====================

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  active: boolean
}

export const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'What are the training dates and times?',
    answer: 'The Executive Masterclass runs for 3 days from March 15-17, 2024. Sessions run from 8:00 AM to 5:00 PM daily with breaks for refreshments and lunch.',
    category: 'general',
    order: 1,
    active: true,
  },
  {
    id: 'faq-2',
    question: 'Where is the training venue?',
    answer: 'The training will be held at Julius Nyerere International Convention Centre in Dar es Salaam, Tanzania. Detailed directions will be sent to registered participants.',
    category: 'general',
    order: 2,
    active: true,
  },
  {
    id: 'faq-3',
    question: 'What payment methods are accepted?',
    answer: 'We accept M-Pesa, Tigo Pesa, Airtel Money, Halo Pesa, Visa/Mastercard, bank transfers, and corporate invoices for organizations.',
    category: 'payment',
    order: 3,
    active: true,
  },
  {
    id: 'faq-4',
    question: 'Can I pay in installments?',
    answer: 'Yes! You can make a 50% deposit to reserve your seat and pay the balance before the training date. Full payment is required at least 7 days before the event.',
    category: 'payment',
    order: 4,
    active: true,
  },
  {
    id: 'faq-5',
    question: 'Is there a refund policy?',
    answer: 'Cancellations made 14+ days before receive 80% refund. 7-13 days receive 50% refund. Less than 7 days: no refund, but you may transfer to another person.',
    category: 'payment',
    order: 5,
    active: true,
  },
  {
    id: 'faq-6',
    question: 'What is included in the registration?',
    answer: 'All packages include training materials, lunch, refreshments, a professional certificate, and post-training mentorship access. VIP packages include additional executive benefits.',
    category: 'registration',
    order: 6,
    active: true,
  },
  {
    id: 'faq-7',
    question: 'Are group discounts available?',
    answer: 'Yes! Groups of 2+ receive 8-20% discounts depending on size. Contact us for corporate packages with 10+ participants.',
    category: 'registration',
    order: 7,
    active: true,
  },
  {
    id: 'faq-8',
    question: 'Will I receive a certificate?',
    answer: 'Yes, all participants receive a professional certificate of completion that can be shared on LinkedIn and used for professional development.',
    category: 'certificate',
    order: 8,
    active: true,
  },
]

// ==================== TESTIMONIALS ====================

export interface Testimonial {
  id: string
  name: string
  title: string
  company: string
  photoUrl?: string
  content: string
  rating: number
  featured: boolean
  order: number
  active: boolean
}

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Grace Mwita',
    title: 'Marketing Director',
    company: 'TechVentures Tanzania',
    content: 'This masterclass transformed how we approach digital marketing. The AI tools training alone was worth the investment. Our social media engagement increased by 300% within 2 months!',
    rating: 5,
    featured: true,
    order: 1,
    active: true,
  },
  {
    id: 'testimonial-2',
    name: 'Peter Massawe',
    title: 'CEO',
    company: 'Massawe Enterprises',
    content: 'The practical approach and hands-on sessions made this training exceptional. I was able to implement automation systems in my business immediately after the training.',
    rating: 5,
    featured: true,
    order: 2,
    active: true,
  },
  {
    id: 'testimonial-3',
    name: 'Amina Hassan',
    title: 'Business Owner',
    company: 'Amina Fashion House',
    content: 'As a small business owner, I was skeptical about AI tools. This masterclass showed me how accessible and powerful these tools can be for any business size.',
    rating: 5,
    featured: false,
    order: 3,
    active: true,
  },
  {
    id: 'testimonial-4',
    name: 'David Okonkwo',
    title: 'Digital Agency Owner',
    company: 'Nexus Digital',
    content: 'The networking opportunities alone were incredible. I made valuable connections and learned strategies that helped me scale my agency from 5 to 20 clients.',
    rating: 5,
    featured: true,
    order: 4,
    active: true,
  },
]

// ==================== CHATBOT CONFIGURATION ====================

export interface ChatbotQA {
  id: string
  keywords: string[]
  question: string
  answer: string
  category: string
  order: number
  active: boolean
}

export const DEFAULT_CHATBOT_QA: ChatbotQA[] = [
  {
    id: 'qa-1',
    keywords: ['price', 'cost', 'fee', 'how much', 'package', 'pricing'],
    question: 'What are the training packages and prices?',
    answer: 'We have 3 packages:\\n- Early Bird: TZS 250,000\\n- Standard: TZS 380,000 (Most Popular)\\n- Corporate VIP: TZS 650,000\\n\\nGroup discounts of 8-20% available for 2+ participants!',
    category: 'pricing',
    order: 1,
    active: true,
  },
  {
    id: 'qa-2',
    keywords: ['date', 'when', 'schedule', 'time', 'days'],
    question: 'When is the training?',
    answer: 'The Executive Masterclass runs for 3 days:\\n- March 15-17, 2024\\n- 8:00 AM - 5:00 PM daily\\n\\nVenue: Julius Nyerere International Convention Centre, Dar es Salaam',
    category: 'schedule',
    order: 2,
    active: true,
  },
  {
    id: 'qa-3',
    keywords: ['pay', 'payment', 'mpesa', 'mobile money', 'card', 'bank'],
    question: 'How can I pay?',
    answer: 'We accept multiple payment methods:\\n- Mobile Money: M-Pesa, Tigo Pesa, Airtel Money, Halo Pesa\\n- Cards: Visa, Mastercard\\n- Bank Transfer\\n- Corporate Invoice\\n\\nYou can pay in installments (50% deposit)!',
    category: 'payment',
    order: 3,
    active: true,
  },
  {
    id: 'qa-4',
    keywords: ['learn', 'topic', 'curriculum', 'course', 'training', 'what'],
    question: 'What will I learn?',
    answer: 'The masterclass covers 6 key modules:\\n1. Social Media Mastery\\n2. Business Automation\\n3. AI Tools & ChatGPT\\n4. Lead Generation\\n5. Analytics & Reporting\\n6. Digital Strategy\\n\\nAll with hands-on practical sessions!',
    category: 'curriculum',
    order: 4,
    active: true,
  },
  {
    id: 'qa-5',
    keywords: ['register', 'sign up', 'book', 'reserve', 'seat'],
    question: 'How do I register?',
    answer: 'You can register directly on our website:\\n1. Fill in your details\\n2. Select your preferred package\\n3. Complete payment\\n\\nYou will receive confirmation via email and WhatsApp. Need help? I can guide you through!',
    category: 'registration',
    order: 5,
    active: true,
  },
  {
    id: 'qa-6',
    keywords: ['group', 'team', 'company', 'corporate', 'bulk'],
    question: 'Do you offer group discounts?',
    answer: 'Yes! Group discounts:\\n- 2 people: 8% off\\n- 3-4 people: 12% off\\n- 5-7 people: 16% off\\n- 8-10 people: 20% off\\n\\nFor 10+ participants, contact us for custom corporate packages!',
    category: 'group',
    order: 6,
    active: true,
  },
  {
    id: 'qa-7',
    keywords: ['certificate', 'certification', 'credential'],
    question: 'Will I get a certificate?',
    answer: 'Yes! All participants receive:\\n- Professional Certificate of Completion\\n- LinkedIn-ready digital badge\\n- Verification link for employers\\n\\nCertificate is issued upon successful completion of the training.',
    category: 'certificate',
    order: 7,
    active: true,
  },
  {
    id: 'qa-8',
    keywords: ['refund', 'cancel', 'cancellation', 'money back'],
    question: 'What is your refund policy?',
    answer: 'Refund policy:\\n- 14+ days before: 80% refund\\n- 7-13 days before: 50% refund\\n- Less than 7 days: No refund (can transfer to another person)\\n\\nContact us for special circumstances.',
    category: 'refund',
    order: 8,
    active: true,
  },
]

// ==================== COMPANY STATS ====================

export interface CompanyStat {
  id: string
  label: string
  value: number
  suffix: string
  icon: string
  order: number
}

export const DEFAULT_COMPANY_STATS: CompanyStat[] = [
  { id: 'stat-1', label: 'Professionals Trained', value: 5000, suffix: '+', icon: 'users', order: 1 },
  { id: 'stat-2', label: 'Partner Companies', value: 500, suffix: '+', icon: 'building', order: 2 },
  { id: 'stat-3', label: 'Success Rate', value: 98, suffix: '%', icon: 'trending-up', order: 3 },
  { id: 'stat-4', label: 'Years Experience', value: 5, suffix: '+', icon: 'award', order: 4 },
]

// ==================== TRAINING INTERESTS ====================

export interface TrainingInterest {
  id: string
  label: string
}

export const TRAINING_INTERESTS: TrainingInterest[] = [
  { id: 'social-media', label: 'Social Media Management' },
  { id: 'automation', label: 'Business Automation' },
  { id: 'ai-tools', label: 'AI Tools & Content Creation' },
  { id: 'advertising', label: 'Paid Advertising' },
  { id: 'lead-generation', label: 'Lead Generation' },
  { id: 'digital-marketing', label: 'Digital Marketing' },
  { id: 'agency-growth', label: 'Agency Growth' },
  { id: 'business-development', label: 'Business Development' },
]

// ==================== PACKAGES ====================

export interface Package {
  id: PackageType
  name: string
  price: number
  originalPrice?: number
  currency: string
  features: string[]
  popular?: boolean
  active: boolean
}

export const PACKAGES: Package[] = [
  {
    id: 'early-bird',
    name: 'Early Bird Package',
    price: 250000,
    currency: 'TZS',
    features: [
      '3 Days Training Access',
      'Lunch & Refreshments',
      'Professional Certificate',
      '30 Days Mentorship',
      '1 Month System Access',
    ],
    active: true,
  },
  {
    id: 'standard',
    name: 'Standard Professional',
    price: 380000,
    currency: 'TZS',
    popular: true,
    features: [
      'Everything in Early Bird Package',
      'Advanced AI & Automation Sessions',
      'Lead Generation Systems',
      'Priority Networking Access',
      'Professional Templates & Resources',
      'Business Consultation Session',
    ],
    active: true,
  },
  {
    id: 'corporate-vip',
    name: 'Corporate / VIP',
    price: 650000,
    originalPrice: 850000,
    currency: 'TZS',
    features: [
      'VIP Access & Seating',
      'Executive Consultation',
      'Premium AI Tools Bundle',
      'Corporate Strategy Support',
      'Personalized Business Guidance',
      'Priority Support Channel',
    ],
    active: true,
  },
]

// Group booking pricing tiers
export interface GroupPricingTier {
  minSeats: number
  maxSeats: number
  discountPercent: number
  perSeatPrice: number
  bonuses: string[]
}

export const GROUP_PRICING_TIERS: GroupPricingTier[] = [
  {
    minSeats: 2,
    maxSeats: 2,
    discountPercent: 8,
    perSeatPrice: 350000,
    bonuses: ['Priority Seating', 'Team Networking Session'],
  },
  {
    minSeats: 3,
    maxSeats: 4,
    discountPercent: 12,
    perSeatPrice: 334000,
    bonuses: ['Priority Seating', 'Team Networking Session', 'Group Photo Session', 'Bonus Resources Pack'],
  },
  {
    minSeats: 5,
    maxSeats: 7,
    discountPercent: 16,
    perSeatPrice: 320000,
    bonuses: ['Priority Seating', 'Team Networking Session', 'Group Photo Session', 'Bonus Resources Pack', '1-Hour Team Consultation'],
  },
  {
    minSeats: 8,
    maxSeats: 10,
    discountPercent: 20,
    perSeatPrice: 304000,
    bonuses: ['VIP Seating', 'Dedicated Team Networking Session', 'Group Photo Session', 'Premium Resources Pack', '2-Hour Team Consultation', 'Custom Team Certificate'],
  },
]

export function getGroupPricing(seats: number, basePackage: PackageType = 'standard'): {
  tier: GroupPricingTier | null
  totalPrice: number
  originalTotal: number
  savings: number
  perSeatPrice: number
} {
  const basePkg = PACKAGES.find(p => p.id === basePackage)
  const basePrice = basePkg?.price || 380000
  const originalTotal = basePrice * seats
  
  if (seats < 2) {
    return {
      tier: null,
      totalPrice: basePrice,
      originalTotal: basePrice,
      savings: 0,
      perSeatPrice: basePrice,
    }
  }
  
  const tier = GROUP_PRICING_TIERS.find(t => seats >= t.minSeats && seats <= t.maxSeats)
  
  if (!tier) {
    const maxTier = GROUP_PRICING_TIERS[GROUP_PRICING_TIERS.length - 1]
    const perSeatPrice = Math.round(basePrice * 0.75)
    return {
      tier: { ...maxTier, minSeats: 10, maxSeats: 999, discountPercent: 25, perSeatPrice },
      totalPrice: perSeatPrice * seats,
      originalTotal,
      savings: originalTotal - (perSeatPrice * seats),
      perSeatPrice,
    }
  }
  
  const totalPrice = tier.perSeatPrice * seats
  return {
    tier,
    totalPrice,
    originalTotal,
    savings: originalTotal - totalPrice,
    perSeatPrice: tier.perSeatPrice,
  }
}

// Seat Management
export interface SeatConfiguration {
  totalSeats: number
  reservedSeats: number
  confirmedSeats: number
  availableSeats: number
  waitlistCount: number
}

export const DEFAULT_SEAT_CONFIG: SeatConfiguration = {
  totalSeats: 100,
  reservedSeats: 0,
  confirmedSeats: 0,
  availableSeats: 100,
  waitlistCount: 0,
}

// Payment Methods Configuration
export interface PaymentMethodConfig {
  id: PaymentMethod
  name: string
  type: 'mobile' | 'card' | 'bank' | 'invoice'
  icon: string
  instructions: string
  accountInfo?: string
  processingTime: string
  minAmount?: number
  maxAmount?: number
  active: boolean
}

export const PAYMENT_METHODS_CONFIG: PaymentMethodConfig[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    type: 'mobile',
    icon: 'mpesa',
    instructions: 'Enter your M-Pesa registered phone number to receive a payment prompt',
    accountInfo: 'Paybill: 888880, Account: MASTERCLASS',
    processingTime: 'Instant',
    maxAmount: 3000000,
    active: true,
  },
  {
    id: 'tigopesa',
    name: 'Tigo Pesa',
    type: 'mobile',
    icon: 'tigo',
    instructions: 'Enter your Tigo Pesa number to receive a payment prompt',
    accountInfo: 'Merchant: 12345678',
    processingTime: 'Instant',
    maxAmount: 3000000,
    active: true,
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    type: 'mobile',
    icon: 'airtel',
    instructions: 'Enter your Airtel Money number to receive a payment prompt',
    accountInfo: 'Merchant: 87654321',
    processingTime: 'Instant',
    maxAmount: 3000000,
    active: true,
  },
  {
    id: 'halopesa',
    name: 'Halo Pesa',
    type: 'mobile',
    icon: 'halo',
    instructions: 'Enter your Halo Pesa number to receive a payment prompt',
    accountInfo: 'Merchant: 99887766',
    processingTime: 'Instant',
    maxAmount: 3000000,
    active: true,
  },
  {
    id: 'visa',
    name: 'Visa Card',
    type: 'card',
    icon: 'visa',
    instructions: 'Enter your Visa card details securely',
    processingTime: 'Instant',
    active: true,
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    type: 'card',
    icon: 'mastercard',
    instructions: 'Enter your Mastercard details securely',
    processingTime: 'Instant',
    active: true,
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    type: 'bank',
    icon: 'bank',
    instructions: 'Transfer to our bank account and upload the payment slip',
    accountInfo: 'CRDB Bank: 0150XXXXXXXX, Account Name: Executive Masterclass Ltd',
    processingTime: '1-2 Business Days',
    active: true,
  },
  {
    id: 'corporate-invoice',
    name: 'Corporate Invoice',
    type: 'invoice',
    icon: 'invoice',
    instructions: 'Request an invoice for your organization',
    processingTime: '3-5 Business Days',
    minAmount: 500000,
    active: true,
  },
]

// Coupon/Discount Codes
export interface CouponCode {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses: number
  usedCount: number
  validUntil: string
  minPurchase?: number
  applicablePackages?: PackageType[]
  description: string
}

export const DEFAULT_COUPONS: CouponCode[] = [
  {
    code: 'EARLY2024',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: 50,
    usedCount: 12,
    validUntil: '2024-12-31',
    description: '10% Early Registration Discount',
  },
  {
    code: 'VIP50K',
    discountType: 'fixed',
    discountValue: 50000,
    maxUses: 20,
    usedCount: 5,
    validUntil: '2024-12-31',
    minPurchase: 500000,
    applicablePackages: ['corporate-vip'],
    description: 'TZS 50,000 off VIP Package',
  },
  {
    code: 'STUDENT25',
    discountType: 'percentage',
    discountValue: 25,
    maxUses: 30,
    usedCount: 8,
    validUntil: '2024-12-31',
    applicablePackages: ['early-bird', 'standard'],
    description: '25% Student Discount',
  },
  {
    code: 'GROUP15',
    discountType: 'percentage',
    discountValue: 15,
    maxUses: 100,
    usedCount: 0,
    validUntil: '2024-12-31',
    minPurchase: 700000,
    description: '15% Additional Group Discount',
  },
]

// Payment Transaction
export interface PaymentTransaction {
  id: string
  participantId: string
  amount: number
  paymentMethod: PaymentMethod
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  reference: string
  phoneNumber?: string
  cardLast4?: string
  createdAt: string
  completedAt?: string
  failureReason?: string
}

export interface Participant {
  id: string
  fullName: string
  phoneNumber: string
  whatsappNumber: string
  email: string
  gender?: Gender
  city: string
  occupation: string
  organizationName?: string
  businessType: string
  yearsOfExperience?: number
  trainingInterests: string[]
  bookingType: BookingType
  groupId?: string
  seatNumbers?: number[]
  selectedPackage: PackageType
  paymentStatus: PaymentStatus
  amountPaid: number
  totalAmount: number
  paymentMethod?: PaymentMethod
  paymentReference?: string
  couponCode?: string
  discountApplied?: number
  companyIdUrl?: string
  introductionLetterUrl?: string
  paymentSlipUrl?: string
  status: ParticipantStatus
  registrationDate: string
  lastUpdated: string
  notes?: string
  receiptNumber?: string
}

export interface GroupRegistration {
  id: string
  organizationName: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  participants: string[]
  totalSeats: number
  basePackage: PackageType
  totalAmount: number
  discountedAmount: number
  amountPaid: number
  paymentStatus: PaymentStatus
  couponCode?: string
  couponDiscount?: number
  paymentMethod?: PaymentMethod
  registrationDate: string
  lastUpdated: string
  notes?: string
}

export const BUSINESS_TYPES = [
  'Technology',
  'Marketing & Advertising',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'Retail & E-commerce',
  'Manufacturing',
  'Government',
  'NGO / Non-Profit',
  'Consulting',
  'Media & Entertainment',
  'Real Estate',
  'Hospitality & Tourism',
  'Agriculture',
  'Transportation & Logistics',
  'Other',
]

export const OCCUPATIONS = [
  'Entrepreneur',
  'Business Owner',
  'Marketing Officer',
  'Social Media Manager',
  'Content Creator',
  'Digital Marketer',
  'Agency Owner',
  'Government Employee',
  'NGO Staff',
  'Student',
  'Freelancer',
  'Corporate Executive',
  'HR Manager',
  'Sales Representative',
  'IT Professional',
  'Other',
]

export interface WaitlistEntry {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  preferredPackage: PackageType
  seatsRequested: number
  registrationDate: string
  notified: boolean
  convertedToParticipant: boolean
  participantId?: string
}

export type NotificationType = 
  | 'registration_confirmation'
  | 'payment_received'
  | 'payment_reminder'
  | 'seat_confirmed'
  | 'waitlist_added'
  | 'waitlist_available'
  | 'event_reminder'
  | 'receipt'

export interface EmailNotification {
  id: string
  recipientEmail: string
  recipientName: string
  type: NotificationType
  subject: string
  sentAt: string
  participantId?: string
}

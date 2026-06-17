import { RegistrationForm } from '@/components/registration-form'
import { ShareQRCode } from '@/components/share-qr-code'
import { HeroSlideshow } from '@/components/hero-slideshow'
import { WhatYouWillLearn } from '@/components/what-you-will-learn'
import { AcademicPartnersSection } from '@/components/academic-partners'
import { TrainersShowcase } from '@/components/trainers-showcase'
import { WhatsAppChatbot } from '@/components/whatsapp-chatbot'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { CreditCard, Smartphone, Shield, Gift } from 'lucide-react'
import { PricingCards } from '@/components/pricing-cards'
import { GroupPricingCards } from '@/components/group-pricing-cards'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Slideshow */}
      <HeroSlideshow />

      {/* What You Will Learn - Comprehensive Curriculum */}
      <WhatYouWillLearn />

      {/* Academic Partner */}
      <AcademicPartnersSection />

      {/* Trainers Showcase */}
      <TrainersShowcase />

      {/* Packages Section */}
      <section id="packages" className="border-b border-border py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Choose Your Package</h2>
            <p className="text-muted-foreground">
              Select the package that best fits your learning goals and budget
            </p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* Group Discounts Section */}
      <section id="group" className="border-b border-border py-16 lg:py-24 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Gift className="h-4 w-4" />
              <span>Save More with Group Booking</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground">Group Discount Packages</h2>
            <p className="text-muted-foreground">
              Bring your team and enjoy significant savings with our group booking offers
            </p>
          </div>
          <GroupPricingCards />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            For groups of 10+ seats, contact us for custom corporate packages with additional benefits
          </p>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="border-b border-border py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Secure Payment Options</h2>
            <p className="text-muted-foreground">
              Choose from multiple convenient payment methods
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-5 text-center transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <Smartphone className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Mobile Money</h3>
              <p className="text-sm text-muted-foreground">M-Pesa, Tigo Pesa, Airtel Money, Halo Pesa</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 text-center transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Card Payments</h3>
              <p className="text-sm text-muted-foreground">Visa, Mastercard, Debit Cards</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 text-center transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Bank Transfer</h3>
              <p className="text-sm text-muted-foreground">Direct bank transfers accepted</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 text-center transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Corporate Invoice</h3>
              <p className="text-sm text-muted-foreground">Invoice available for organizations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="register" className="py-16 lg:py-24 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-4">Registration Open</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground">Secure Your Seat</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join hundreds of professionals transforming their business with digital skills
            </p>
          </div>
          <RegistrationForm />
          <ShareQRCode />
        </div>
      </section>

      <SiteFooter />

      {/* WhatsApp Chatbot */}
      <WhatsAppChatbot />
    </div>
  )
}

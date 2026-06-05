import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles,
  Target,
  Award,
  Users,
  Globe,
  CheckCircle2,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Building2,
  Briefcase,
  GraduationCap,
  Star,
  Quote,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WhatsAppChatbot } from '@/components/whatsapp-chatbot'

export const metadata: Metadata = {
  title: 'About Us - Executive Masterclass',
  description: 'Learn more about Executive Masterclass - Tanzania\'s premier training program for Social Media, AI & Business Automation',
}

const stats = [
  { value: '5,000+', label: 'Professionals Trained', icon: Users },
  { value: '500+', label: 'Companies Served', icon: Building2 },
  { value: '15+', label: 'Years Experience', icon: Calendar },
  { value: '98%', label: 'Satisfaction Rate', icon: Star },
]

const values = [
  {
    icon: Target,
    title: 'Excellence',
    description: 'We deliver world-class training that meets international standards while being relevant to the African market.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We build lasting connections between professionals, creating a network of support and collaboration.',
  },
  {
    icon: GraduationCap,
    title: 'Practical Learning',
    description: 'Our programs focus on hands-on skills you can immediately apply to grow your business.',
  },
  {
    icon: Globe,
    title: 'Innovation',
    description: 'We stay at the forefront of digital trends, bringing the latest tools and strategies to our participants.',
  },
]

const milestones = [
  { year: '2010', event: 'Founded as a digital marketing consultancy' },
  { year: '2014', event: 'Launched first professional training program' },
  { year: '2017', event: 'Expanded to East African markets' },
  { year: '2020', event: 'Pioneered AI training in Tanzania' },
  { year: '2023', event: 'Launched Executive Masterclass series' },
  { year: '2024', event: 'Reached 5,000+ trained professionals' },
]

const testimonials = [
  {
    quote: 'The Executive Masterclass transformed how I approach digital marketing. The AI tools section alone saved my team 20 hours per week.',
    author: 'Maria Kijana',
    role: 'Marketing Director, TechStart Ltd',
    rating: 5,
  },
  {
    quote: 'Best investment in professional development I\'ve ever made. The trainers are world-class and the content is immediately applicable.',
    author: 'John Mwamba',
    role: 'CEO, Mwamba Enterprises',
    rating: 5,
  },
  {
    quote: 'The automation strategies I learned helped me scale my business without hiring additional staff. Highly recommended!',
    author: 'Grace Omondi',
    role: 'Founder, GraceStyle Fashion',
    rating: 5,
  },
]

const faqs = [
  {
    question: 'Who is this training for?',
    answer: 'This training is designed for business owners, marketing professionals, entrepreneurs, and anyone looking to leverage digital tools for business growth. No prior technical experience is required.',
  },
  {
    question: 'What do I need to bring?',
    answer: 'Bring a laptop or tablet with internet capability. We provide all training materials, notepads, and refreshments. Lunch is included for Standard and VIP packages.',
  },
  {
    question: 'Is there a certificate?',
    answer: 'Yes! All participants receive a Certificate of Completion. VIP package holders receive an enhanced certificate with a LinkedIn digital badge.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'Full refunds are available up to 14 days before the event. Within 14 days, you can transfer your registration to a future session or send a colleague in your place.',
  },
  {
    question: 'Do you offer corporate packages?',
    answer: 'Yes! We offer special rates for groups of 5 or more from the same organization. Contact us for custom corporate training solutions.',
  },
  {
    question: 'Will I receive ongoing support?',
    answer: 'Yes! All participants get access to our alumni community. VIP members receive 3 months of email support and priority access to future events.',
  },
]

export default function AboutPage() {
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
            <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium text-foreground">
              About
            </Link>
            <Link href="/#packages" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Packages
            </Link>
            <Link href="/#trainers" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Trainers
            </Link>
            <Link href="/#register" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Register
            </Link>
          </nav>
          <Link
            href="/admin"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Admin Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Award className="h-4 w-4" />
              <span>About Executive Masterclass</span>
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Empowering African Businesses Through{' '}
              <span className="text-primary">Digital Excellence</span>
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Since 2010, we have been at the forefront of digital transformation in East Africa,
              training thousands of professionals and helping businesses thrive in the digital age.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="border-b border-border py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                <Target className="h-4 w-4" />
                Our Mission
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Bridging the Digital Skills Gap in Africa
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is to equip African businesses and professionals with the digital skills
                they need to compete globally. We believe that with the right knowledge and tools,
                African entrepreneurs can build world-class businesses that create jobs and drive
                economic growth.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Through our intensive training programs, we provide practical, actionable skills that
                participants can immediately apply to grow their businesses. We focus on the latest
                technologies including AI, automation, and digital marketing strategies that deliver
                measurable results.
              </p>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                <Globe className="h-4 w-4" />
                Our Vision
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                A Digitally Empowered Africa
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We envision an Africa where every business has access to world-class digital
                knowledge and tools. Where entrepreneurs can leverage technology to scale their
                operations, reach global markets, and create lasting impact in their communities.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By 2030, we aim to train 50,000 professionals across East Africa, creating a ripple
                effect of digital transformation that will benefit millions of people through job
                creation, improved services, and economic growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-border bg-secondary/10 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Our Core Values</h2>
            <p className="text-muted-foreground">
              These principles guide everything we do
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card
                  key={index}
                  className="border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-b border-border py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Our Journey</h2>
            <p className="text-muted-foreground">
              Key milestones in our mission to transform African businesses
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" />
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative flex items-center gap-4 ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-primary md:left-1/2 md:-translate-x-1/2">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className={`ml-16 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <span className="text-lg font-bold text-primary">{milestone.year}</span>
                      <p className="text-muted-foreground">{milestone.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border bg-secondary/10 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">What Our Participants Say</h2>
            <p className="text-muted-foreground">
              Hear from professionals who have transformed their businesses
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border bg-card">
                <CardContent className="p-6">
                  <Quote className="mb-4 h-8 w-8 text-primary/30" />
                  <p className="mb-4 text-muted-foreground italic leading-relaxed">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Got questions? We have answers
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between p-4">
                  <h3 className="font-medium text-foreground">{faq.question}</h3>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-border px-4 py-3">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-b border-border bg-secondary/10 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-foreground">Get In Touch</h2>
              <p className="mb-8 text-muted-foreground">
                Have questions about our training programs? Our team is here to help you make the
                right choice for your professional development.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">+255 123 456 789</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">info@executivemasterclass.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <p className="font-medium text-foreground">+255 123 456 789</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">Dar es Salaam, Tanzania</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Office Hours</p>
                    <p className="font-medium text-foreground">Mon - Fri: 8:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-8 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-bold text-foreground">Ready to Transform Your Business?</h3>
              <p className="mb-6 text-muted-foreground">
                Join thousands of professionals who have upgraded their skills with us
              </p>
              <Button size="lg" asChild>
                <Link href="/#register">
                  Register Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Executive Masterclass. All rights reserved.
          </p>
        </div>
      </footer>

      {/* WhatsApp Chatbot */}
      <WhatsAppChatbot />
    </div>
  )
}

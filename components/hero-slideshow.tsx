'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Sparkles, Calendar, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHeroSlides, getSiteSettings, patchMemStore } from '@/lib/store'
import type { HeroSlide, SiteSettings } from '@/lib/types'
import { assetUrl } from '@/lib/utils'
import { useStoreReady } from '@/components/store-provider'

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start + 'T00:00:00')
    const e = new Date(end + 'T00:00:00')
    const ms = s.toLocaleDateString('en-US', { month: 'short' })
    const me = e.toLocaleDateString('en-US', { month: 'short' })
    const year = e.getFullYear()
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${ms} ${s.getDate()}–${e.getDate()}, ${year}`
    }
    return `${ms} ${s.getDate()} – ${me} ${e.getDate()}, ${year}`
  } catch {
    return [start, end].filter(Boolean).join(' – ')
  }
}

interface HeroSlideshowProps {
  initialSlides?: HeroSlide[]
  initialSettings?: SiteSettings
}

export function HeroSlideshow({ initialSlides, initialSettings }: HeroSlideshowProps) {
  const storeReady = useStoreReady()
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides ?? [])
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings ?? null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // isMounted guards SSR hydration — set on first client render only
  useEffect(() => { setIsMounted(true) }, [])

  // Re-read from memStore after store syncs (metadata fast path — imageUrl may be empty here)
  useEffect(() => {
    if (!storeReady) return
    setSlides(getHeroSlides())
    setSettings(getSiteSettings())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  // Lazy-load the full hero slides including base64 images.
  // The light-store response strips base64 imageUrl to keep initial load fast;
  // we fetch the single key here so images appear as soon as the page is visible.
  // patchMemStore ensures any subsequent getHeroSlides() calls (e.g. in admin
  // save operations) return the full data, preventing accidental image erasure.
  useEffect(() => {
    if (!storeReady) return
    fetch('/api/store?key=masterclass_hero_slides', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((row: { key: string; value: HeroSlide[] } | null) => {
        if (row?.value && Array.isArray(row.value)) {
          patchMemStore('masterclass_hero_slides', row.value)
          const active = row.value.filter(s => s.active).sort((a, b) => a.order - b.order)
          if (active.length > 0) setSlides(active)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 5000)
  }

  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, slides.length])

  // Default fallback slides for SSR
  const displaySlides = slides.length > 0 ? slides : [
    {
      id: 'default-1',
      title: 'Executive Masterclass 2024',
      subtitle: 'Transform Your Business',
      description: 'A 3-day intensive program on Social Media, Business Automation & AI Agents',
      imageUrl: '/images/hero-1.jpg',
      ctaText: 'Register Now',
      ctaLink: '#register',
      order: 1,
      active: true,
    }
  ]

  return (
    <section className="relative h-[600px] overflow-hidden lg:h-[700px]">
      {/* Slides */}
      {displaySlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={assetUrl(slide.imageUrl) || '/images/hero-1.jpg'}
            alt={slide.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
          <span>Limited Seats Available</span>
        </div>

        <h1 className="mb-3 max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {isMounted && settings ? settings.eventName : 'Executive Masterclass'}
        </h1>

        {isMounted && settings?.eventTagline && (
          <p className="mb-3 max-w-2xl text-xl font-semibold text-primary sm:text-2xl">
            {settings.eventTagline}
          </p>
        )}

        {/* Dynamic Slide Text */}
        <div className="mb-6 h-20">
          {displaySlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`transition-all duration-500 ${
                index === currentSlide
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0 absolute'
              }`}
            >
              {index === currentSlide && (
                <>
                  <h2 className="mb-2 text-2xl font-semibold text-foreground sm:text-3xl">
                    {slide.title}
                  </h2>
                  <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {isMounted && settings?.eventDate && settings?.eventEndDate
                ? formatDateRange(settings.eventDate, settings.eventEndDate)
                : '3 Days Intensive Training'}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>
              {isMounted && settings
                ? settings.eventVenue
                  ? `${settings.eventVenue}, ${settings.eventCity}`
                  : `${settings.eventCity}, ${settings.eventCountry}`
                : 'Dar es Salaam, Tanzania'}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {isMounted && settings?.eventTime ? settings.eventTime : 'Daily 08:00 AM – 05:00 PM'}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button size="lg" asChild>
            <a href={displaySlides[currentSlide]?.ctaLink || '#register'}>
              {displaySlides[currentSlide]?.ctaText || 'Register Now'}
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="/#curriculum">Learn More</a>
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {displaySlides.length > 1 && (
        <>
          <button
            onClick={() => {
              prevSlide()
              setIsAutoPlaying(false)
              setTimeout(() => setIsAutoPlaying(true), 5000)
            }}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/50 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-background/80"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => {
              nextSlide()
              setIsAutoPlaying(false)
              setTimeout(() => setIsAutoPlaying(true), 5000)
            }}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/50 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-background/80"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {displaySlides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-foreground/30 hover:bg-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

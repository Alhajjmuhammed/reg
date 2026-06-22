'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ExternalLink, Building2, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { getAcademicPartners, getAcademicPartnerSettings } from '@/lib/store'
import type { AcademicPartner, AcademicPartnerSettings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStoreReady, useStoreVersion } from '@/components/store-provider'

function AcademicPartnersCarousel({ partners }: { partners: AcademicPartner[] }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = partners.length

  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total])
  const prev = () => setCurrent(c => (c - 1 + total) % total)

  useEffect(() => {
    if (total <= 1) return
    timerRef.current = setInterval(next, 6000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next, total])

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 6000)
  }

  const goTo = (i: number) => { setCurrent(i); resetTimer() }
  const handlePrev = () => { prev(); resetTimer() }
  const handleNext = () => { next(); resetTimer() }

  if (total === 0) return null
  const partner = partners[current]

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left column: logo + description */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-border">
            <div className="flex items-center justify-center bg-muted/40 p-10 min-h-[200px]">
              {partner.logoUrl ? (
                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  className="max-h-28 max-w-[220px] object-contain"
                />
              ) : (
                <div className="flex h-24 w-full max-w-[220px] items-center justify-center rounded-xl border-2 border-dashed text-2xl font-bold text-muted-foreground">
                  {partner.name[0]}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 p-6 flex-1">
              <h3 className="text-lg font-bold text-foreground">{partner.name}</h3>
              {partner.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{partner.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Official academic partner of Executive Masterclass</p>
              )}
              {partner.websiteUrl && (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit website
                </a>
              )}
            </div>
          </div>

          {/* Right column: banner */}
          <div className="relative min-h-[260px] md:min-h-[360px] overflow-hidden bg-muted/20">
            {partner.bannerUrl ? (
              <img
                src={partner.bannerUrl}
                alt={`${partner.name} banner`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center flex-col gap-3 text-muted-foreground">
                <GraduationCap className="h-16 w-16 opacity-20" />
                <span className="text-sm opacity-40">No banner uploaded</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 border shadow backdrop-blur-sm hover:bg-background transition-colors"
            aria-label="Previous academic partner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 border shadow backdrop-blur-sm hover:bg-background transition-colors"
            aria-label="Next academic partner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-center gap-2 mt-5">
            {partners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'rounded-full transition-all',
                  i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                )}
                aria-label={`Go to academic partner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface AcademicPartnersSectionProps {
  initialPartners?: AcademicPartner[]
  initialSettings?: AcademicPartnerSettings
}

export function AcademicPartnersSection({ initialPartners, initialSettings }: AcademicPartnersSectionProps) {
  const storeReady = useStoreReady()
  const storeVersion = useStoreVersion()
  const [partners, setPartners] = useState<AcademicPartner[]>(initialPartners ?? [])
  const [sectionSettings, setSectionSettings] = useState<AcademicPartnerSettings | null>(initialSettings ?? null)
  const [mounted, setMounted] = useState(!!initialPartners)

  useEffect(() => {
    setMounted(true)
    if (!storeReady) return
    setPartners(getAcademicPartners())
    setSectionSettings(getAcademicPartnerSettings())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady, storeVersion])

  if (!mounted || partners.length === 0 || !sectionSettings) return null

  return (
    <section className="border-b border-border py-16 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-center text-foreground">{sectionSettings.sectionTitle}</h2>
        </div>
        <p className="text-center text-muted-foreground mb-10 text-sm">
          {sectionSettings.sectionDescription}
        </p>
        <AcademicPartnersCarousel partners={partners} />
      </div>
    </section>
  )
}

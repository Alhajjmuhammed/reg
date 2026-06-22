'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/store'
import type { SiteSettings } from '@/lib/types'
import { useStoreReady, useStoreVersion } from '@/components/store-provider'

export function SiteFooter() {
  const storeReady = useStoreReady()
  const storeVersion = useStoreVersion()
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    setSettings(getSiteSettings())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady, storeVersion])

  const phone = settings?.contactPhone || '+255 712 345 678'
  const email = settings?.contactEmail || 'info@executivemasterclass.co.tz'
  const whatsapp = settings?.contactWhatsApp || '+255 712 345 678'
  const city = settings?.eventCity || 'Dar es Salaam'
  const country = settings?.eventCountry || 'Tanzania'
  const officeHours = settings?.officeHours || 'Mon–Fri: 8:00 AM – 6:00 PM'
  const eventName = settings?.eventName || 'Executive Masterclass'
  const companyName = settings?.companyName || eventName

  return (
    <footer className="border-t border-border bg-secondary/10 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4">
              <img src="/images/logo.png" alt={companyName} className="h-8 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground">
              {settings?.companyDescription || 'Empowering African businesses through digital excellence.'}
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#curriculum" className="text-muted-foreground hover:text-foreground">Curriculum</Link></li>
              <li><Link href="/#trainers" className="text-muted-foreground hover:text-foreground">Trainers</Link></li>
              <li><Link href="/#packages" className="text-muted-foreground hover:text-foreground">Packages</Link></li>
              <li><Link href="/sponsorship" className="text-muted-foreground hover:text-foreground">Sponsorship</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Phone: {phone}</li>
              <li>Email: {email}</li>
              <li>WhatsApp: {whatsapp}</li>
              <li>Location: {city}, {country}</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Office Hours</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {officeHours.split(/[,\n]/).map((line, i) => (
                <li key={i}>{line.trim()}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

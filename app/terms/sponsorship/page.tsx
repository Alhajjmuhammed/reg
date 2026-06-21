'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTermsContent } from '@/lib/store'
import { useStoreReady } from '@/components/store-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { sanitizeHtml } from '@/lib/utils'

export default function SponsorshipTermsPage() {
  const storeReady = useStoreReady()
  const [content, setContent] = useState('')

  useEffect(() => {
    setContent(getTermsContent().sponsorship)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/haminass-logo.png" alt="HAMINASS" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link href="/sponsorship">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sponsorship Terms &amp; Conditions</h1>
            <p className="text-sm text-muted-foreground">Sponsorship Agreement</p>
          </div>
        </div>

        {content ? (
          <div
            className="rounded-xl border border-border bg-card p-8 prose prose-sm max-w-none
              text-foreground
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-4 [&_h2]:mt-0
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2
              [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3
              [&_ul]:text-muted-foreground [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
          />
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/sponsorship">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sponsorship
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

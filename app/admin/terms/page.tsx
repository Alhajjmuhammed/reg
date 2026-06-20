'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getTermsContent, setTermsContent } from '@/lib/store'
import { useStoreReady } from '@/components/store-provider'
import { ScrollText, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function TermsPage() {
  const storeReady = useStoreReady()
  const [registration, setRegistration] = useState('')
  const [sponsorship, setSponsorship] = useState('')
  const [saved, setSaved] = useState<'registration' | 'sponsorship' | null>(null)
  const [preview, setPreview] = useState<'registration' | 'sponsorship' | null>(null)

  useEffect(() => {
    const terms = getTermsContent()
    setRegistration(terms.registration)
    setSponsorship(terms.sponsorship)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  const save = (type: 'registration' | 'sponsorship') => {
    setTermsContent({ [type]: type === 'registration' ? registration : sponsorship })
    setSaved(type)
    setTimeout(() => setSaved(null), 2500)
  }

  return (
    <AdminLayout requiredPermission="terms.manage">
      <div className="space-y-8">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Terms &amp; Conditions</h1>
            <p className="text-sm text-muted-foreground">Manage the T&amp;C shown to participants and sponsors before they submit</p>
          </div>
        </div>

        {/* Registration T&C */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Registration Terms &amp; Conditions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Shown at <span className="font-mono">/terms/registration</span> — participants must agree before payment</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreview(preview === 'registration' ? null : 'registration')}
                className="gap-1.5"
              >
                {preview === 'registration' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {preview === 'registration' ? 'Hide' : 'Preview'}
              </Button>
              <Button size="sm" onClick={() => save('registration')} className="gap-1.5" disabled={!storeReady}>
                {saved === 'registration'
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                  : <><Save className="h-3.5 w-3.5" /> Save</>
                }
              </Button>
            </div>
          </div>

          {preview === 'registration' ? (
            <div
              className="prose prose-sm max-w-none rounded-lg border border-border bg-background p-5 text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: registration }}
            />
          ) : (
            <Textarea
              value={registration}
              onChange={e => setRegistration(e.target.value)}
              rows={18}
              className="font-mono text-xs"
              placeholder="Enter HTML content for registration T&C..."
            />
          )}
          <p className="text-xs text-muted-foreground">You can use basic HTML: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;</p>
        </div>

        {/* Sponsorship T&C */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Sponsorship Terms &amp; Conditions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Shown at <span className="font-mono">/terms/sponsorship</span> — sponsors must agree before proceeding to payment</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreview(preview === 'sponsorship' ? null : 'sponsorship')}
                className="gap-1.5"
              >
                {preview === 'sponsorship' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {preview === 'sponsorship' ? 'Hide' : 'Preview'}
              </Button>
              <Button size="sm" onClick={() => save('sponsorship')} className="gap-1.5" disabled={!storeReady}>
                {saved === 'sponsorship'
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                  : <><Save className="h-3.5 w-3.5" /> Save</>
                }
              </Button>
            </div>
          </div>

          {preview === 'sponsorship' ? (
            <div
              className="prose prose-sm max-w-none rounded-lg border border-border bg-background p-5 text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sponsorship }}
            />
          ) : (
            <Textarea
              value={sponsorship}
              onChange={e => setSponsorship(e.target.value)}
              rows={18}
              className="font-mono text-xs"
              placeholder="Enter HTML content for sponsorship T&C..."
            />
          )}
          <p className="text-xs text-muted-foreground">You can use basic HTML: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;</p>
        </div>

      </div>
    </AdminLayout>
  )
}

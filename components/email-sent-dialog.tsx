'use client'

import { useEffect, useState } from 'react'
import { X, Mail, CheckCircle2 } from 'lucide-react'

interface EmailSentDialogProps {
  email: string
  eventName?: string
}

export function EmailSentDialog({ email, eventName }: EmailSentDialogProps) {
  const [open, setOpen] = useState(false)

  // Auto-open shortly after mount so the success screen renders first
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 400)
    return () => clearTimeout(t)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-semibold">Submission Confirmed</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 text-center">
          {/* Email icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>

          <h3 className="mb-2 text-lg font-bold text-foreground">
            Check Your Email
          </h3>

          <p className="mb-1 text-sm text-muted-foreground">
            A confirmation email for
          </p>
          {eventName && (
            <p className="mb-3 font-semibold text-foreground">{eventName}</p>
          )}
          <p className="mb-4 text-sm text-muted-foreground">
            has been sent to:
          </p>

          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="break-all font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
              {email}
            </p>
          </div>

          {/* Spam notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              ⚠️ Don&apos;t see it?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
              If it&apos;s there, mark it as <strong>&quot;Not Spam&quot;</strong> so future emails reach your inbox.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}

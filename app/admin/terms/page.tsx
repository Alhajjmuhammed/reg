'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { getTermsContent, setTermsContent, flushTermsContent } from '@/lib/store'
import { useStoreReady } from '@/components/store-provider'
import { sanitizeHtml } from '@/lib/utils'
import {
  ScrollText, Save, Eye, EyeOff, CheckCircle2, AlertCircle,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Type,
} from 'lucide-react'

// ── Toolbar button ─────────────────────────────────────────────────────────
function TBtn({
  onMouseDown, title, children,
}: {
  onMouseDown: (e: React.MouseEvent) => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      title={title}
      className="flex h-7 min-w-[1.75rem] items-center justify-center rounded px-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  )
}

// ── Rich text editor ───────────────────────────────────────────────────────
function RichEditor({
  label,
  description,
  editorId,
  initialHtml,
}: {
  label: string
  description: string
  editorId: string
  initialHtml: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const htmlRef = useRef(initialHtml)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Set content once on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeHtml(initialHtml) || '<p><br></p>'
      htmlRef.current = editorRef.current.innerHTML
      // Set default paragraph separator so Enter creates <p> not <div>
      document.execCommand('defaultParagraphSeparator', false, 'p')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When switching back from preview, restore content
  useEffect(() => {
    if (!preview && editorRef.current) {
      editorRef.current.innerHTML = htmlRef.current
    }
  }, [preview])

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value ?? undefined)
    if (editorRef.current) htmlRef.current = editorRef.current.innerHTML
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.ctrlKey || e.metaKey
    if (!mod) return
    if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleSave(); return }
    // Bold/Italic/Underline are browser-native in contenteditable — no action needed
    // Add Ctrl+Shift+X for strikethrough
    if ((e.key === 'x' || e.key === 'X') && e.shiftKey) {
      e.preventDefault()
      exec('strikeThrough')
    }
  }

  const handleInput = () => {
    if (editorRef.current) htmlRef.current = editorRef.current.innerHTML
  }

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3500)
  }

  const handleSave = async () => {
    const html = editorRef.current?.innerHTML ?? htmlRef.current
    setSaving(true)
    try {
      setTermsContent({ [editorId]: html })
      await flushTermsContent()
      showAlert('success', 'Saved to Supabase successfully!')
    } catch (err) {
      showAlert('error', err instanceof Error ? err.message : 'Save failed — check your connection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{label}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline" size="sm"
            onClick={() => setPreview(p => !p)}
            className="gap-1.5"
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving
              ? 'Saving…'
              : <><Save className="h-3.5 w-3.5" /> Save</>
            }
          </Button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          alert.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
            : 'bg-destructive/10 text-destructive'
        }`}>
          {alert.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />
          }
          {alert.msg}
        </div>
      )}

      {/* Toolbar */}
      {!preview && (
        <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-muted/20 p-1.5">
          {/* Inline formatting — browser handles Ctrl+B, Ctrl+I, Ctrl+U natively */}
          <TBtn onMouseDown={e => { e.preventDefault(); exec('bold') }} title="Bold (Ctrl+B)">
            <Bold className="h-3.5 w-3.5" />
          </TBtn>
          <TBtn onMouseDown={e => { e.preventDefault(); exec('italic') }} title="Italic (Ctrl+I)">
            <Italic className="h-3.5 w-3.5" />
          </TBtn>
          <TBtn onMouseDown={e => { e.preventDefault(); exec('underline') }} title="Underline (Ctrl+U)">
            <Underline className="h-3.5 w-3.5" />
          </TBtn>
          <TBtn onMouseDown={e => { e.preventDefault(); exec('strikeThrough') }} title="Strikethrough (Ctrl+Shift+X)">
            <Strikethrough className="h-3.5 w-3.5" />
          </TBtn>

          <div className="mx-1.5 h-5 w-px bg-border shrink-0" />

          {/* Block formatting */}
          <TBtn onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2') }} title="Main Title (H2)">
            <span className="text-[11px] font-extrabold leading-none">T1</span>
          </TBtn>
          <TBtn onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h3') }} title="Subheading (H3)">
            <span className="text-[11px] font-bold leading-none">T2</span>
          </TBtn>
          <TBtn onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'p') }} title="Paragraph">
            <Type className="h-3.5 w-3.5" />
          </TBtn>

          <div className="mx-1.5 h-5 w-px bg-border shrink-0" />

          {/* Lists */}
          <TBtn onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }} title="Bullet List">
            <List className="h-3.5 w-3.5" />
          </TBtn>
          <TBtn onMouseDown={e => { e.preventDefault(); exec('insertOrderedList') }} title="Numbered List">
            <ListOrdered className="h-3.5 w-3.5" />
          </TBtn>

          <div className="mx-1.5 h-5 w-px bg-border shrink-0" />

          {/* Text alignment */}
          <TBtn onMouseDown={e => { e.preventDefault(); exec('justifyLeft') }} title="Align Left">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="0.75"/><rect x="1" y="5.5" width="9" height="1.5" rx="0.75"/><rect x="1" y="9" width="14" height="1.5" rx="0.75"/><rect x="1" y="12.5" width="9" height="1.5" rx="0.75"/></svg>
          </TBtn>
          <TBtn onMouseDown={e => { e.preventDefault(); exec('justifyCenter') }} title="Center">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="0.75"/><rect x="3.5" y="5.5" width="9" height="1.5" rx="0.75"/><rect x="1" y="9" width="14" height="1.5" rx="0.75"/><rect x="3.5" y="12.5" width="9" height="1.5" rx="0.75"/></svg>
          </TBtn>

          <span className="ml-auto text-[10px] text-muted-foreground hidden sm:block">
            Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline · Ctrl+S Save
          </span>
        </div>
      )}

      {/* Editor (hidden in preview mode, not unmounted — preserves content & undo) */}
      <div style={{ display: preview ? 'none' : 'block' }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          spellCheck
          className="min-h-[300px] rounded-lg border border-border bg-background p-4 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:mt-5 first:[&_*]:mt-0
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:mt-4
            [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-2
            [&_ul]:text-muted-foreground [&_ul]:pl-5 [&_ul]:mb-2 [&_ul_li]:list-disc [&_ul_li]:mb-1
            [&_ol]:text-muted-foreground [&_ol]:pl-5 [&_ol]:mb-2 [&_ol_li]:list-decimal [&_ol_li]:mb-1
            [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through"
        />
      </div>

      {/* Preview */}
      {preview && (
        <div
          className="min-h-[200px] rounded-lg border border-border bg-background p-5 text-sm text-foreground
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:mt-5 first:[&_*]:mt-0
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:mt-4
            [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-2
            [&_ul]:text-muted-foreground [&_ul]:pl-5 [&_ul]:mb-2 [&_ul_li]:list-disc [&_ul_li]:mb-1
            [&_ol]:text-muted-foreground [&_ol]:pl-5 [&_ol]:mb-2 [&_ol_li]:list-decimal [&_ol_li]:mb-1
            [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlRef.current) }}
        />
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function TermsPage() {
  const storeReady = useStoreReady()
  const [registration, setRegistration] = useState('')
  const [sponsorship, setSponsorship] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!storeReady) return
    const terms = getTermsContent()
    setRegistration(terms.registration)
    setSponsorship(terms.sponsorship)
    setLoaded(true)
  }, [storeReady])

  return (
    <AdminLayout requiredPermission="terms.manage">
      <div className="space-y-8">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Terms &amp; Conditions</h1>
            <p className="text-sm text-muted-foreground">
              Write the T&amp;C shown to participants and sponsors. Use the toolbar or keyboard shortcuts to format text.
            </p>
          </div>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <RichEditor
              key="registration"
              editorId="registration"
              label="Registration Terms & Conditions"
              description="Participants must agree to these before completing payment"
              initialHtml={registration}
            />
            <RichEditor
              key="sponsorship"
              editorId="sponsorship"
              label="Sponsorship Terms & Conditions"
              description="Sponsors must agree to these before submitting their application"
              initialHtml={sponsorship}
            />
          </>
        )}
      </div>
    </AdminLayout>
  )
}

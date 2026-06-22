'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { useStoreReady } from '@/components/store-provider'
import {
  getAllCurriculum,
  createCurriculumModule,
  updateCurriculumModule,
  deleteCurriculumModule,
  flushCurriculumModules,
} from '@/lib/store'
import type { CurriculumModule } from '@/lib/types'
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save,
  Loader2, Check, AlertCircle, X, BookOpen,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, sanitizeHtml } from '@/lib/utils'

// ─── helpers ───────────────────────────────────────────────────────────────

const EMPTY_MODULE: Omit<CurriculumModule, 'id'> = {
  title: '',
  description: '',
  icon: 'zap',
  topics: [],
  outcomes: [],
  duration: '',
  day: 1,
  order: 1,
  active: true,
}

/**
 * Ensures plain-text descriptions get a <p> wrapper so the browser uses
 * paragraph mode instead of <div> mode when the user presses Enter.
 */
function ensureHtmlDesc(html: string): string {
  if (!html) return '<p><br></p>'
  const trimmed = html.trim()
  // Already starts with a block-level tag — use as-is
  if (/^<(p|h[1-6]|ul|ol|div|blockquote)/i.test(trimmed)) return trimmed
  return `<p>${trimmed}</p>`
}

function toListHtml(items: string[]): string {
  if (!items || items.length === 0) return '<ul><li><br></li></ul>'
  return '<ul>' + items.map(t => `<li>${t}</li>`).join('') + '</ul>'
}

/**
 * Extracts list items from HTML produced by the rich editor.
 * Strips trailing <br> that browsers inject into focused <li> elements.
 */
function extractListItems(html: string): string[] {
  if (typeof window === 'undefined' || !html) return []
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Primary: pull <li> content
  const liItems: string[] = []
  doc.querySelectorAll('li').forEach(li => {
    // Strip trailing/leading <br> tags the browser injects for cursor placement
    const content = li.innerHTML
      .replace(/^(\s*<br\s*\/?>\s*)+/gi, '')
      .replace(/(\s*<br\s*\/?>\s*)+$/gi, '')
      .trim()
    if (content) liItems.push(content)
  })
  if (liItems.length > 0) return liItems

  // Fallback: pull <p> / <div> blocks as separate items
  const blockItems: string[] = []
  doc.querySelectorAll('p, div').forEach(el => {
    const content = el.innerHTML
      .replace(/^(\s*<br\s*\/?>\s*)+/gi, '')
      .replace(/(\s*<br\s*\/?>\s*)+$/gi, '')
      .trim()
    if (content) blockItems.push(content)
  })
  if (blockItems.length > 0) return blockItems

  // Last resort: raw text
  const text = doc.body.textContent?.trim() ?? ''
  return text ? [text] : []
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', className)}>
      {children}
    </span>
  )
}

// ─── Toolbar button ────────────────────────────────────────────────────────

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

// ─── Rich field ────────────────────────────────────────────────────────────

interface RichFieldProps {
  label: string
  /** Initial HTML or plain text — component normalises it */
  defaultHtml: string
  /** Always kept in sync with the latest editor HTML */
  htmlRef: React.MutableRefObject<string>
  editorRef: React.RefObject<HTMLDivElement | null>
  minHeight?: number
  /** compact = only inline formatting + lists, no block headings */
  compact?: boolean
}

function RichField({ label, defaultHtml, htmlRef, editorRef, minHeight = 130, compact = false }: RichFieldProps) {
  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    // Normalise: plain text → wrapped in <p>; HTML → sanitised as-is
    const sanitised = sanitizeHtml(defaultHtml)
    el.innerHTML = compact
      ? (sanitised || '<ul><li><br></li></ul>')
      : ensureHtmlDesc(sanitised)

    // Keep the ref in sync with whatever the browser actually stored
    htmlRef.current = el.innerHTML

    document.execCommand('defaultParagraphSeparator', false, 'p')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sync = () => {
    if (editorRef.current) htmlRef.current = editorRef.current.innerHTML
  }

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val ?? undefined)
    sync()
  }

  return (
    <div className="flex flex-col">
      <Label className="mb-1.5 block">{label}</Label>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-border bg-muted/30 px-1.5 py-1">
        <TBtn onMouseDown={e => { e.preventDefault(); exec('bold') }} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn onMouseDown={e => { e.preventDefault(); exec('italic') }} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn onMouseDown={e => { e.preventDefault(); exec('underline') }} title="Underline (Ctrl+U)">
          <Underline className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn onMouseDown={e => { e.preventDefault(); exec('strikeThrough') }} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </TBtn>

        <div className="mx-1.5 h-4 w-px bg-border shrink-0" />

        {!compact && (
          <>
            <TBtn onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h3') }} title="Subheading">
              <span className="text-[11px] font-extrabold leading-none">H3</span>
            </TBtn>
            <TBtn onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'p') }} title="Paragraph">
              <Type className="h-3.5 w-3.5" />
            </TBtn>
            <div className="mx-1.5 h-4 w-px bg-border shrink-0" />
          </>
        )}

        <TBtn onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </TBtn>
        <TBtn onMouseDown={e => { e.preventDefault(); exec('insertOrderedList') }} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </TBtn>
      </div>
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={sync}
        style={{ minHeight }}
        className="w-full rounded-b-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none
          focus:ring-1 focus:ring-primary/30
          [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through
          [&_ul]:pl-5 [&_ul]:list-disc [&_ul_li]:mb-0.5
          [&_ol]:pl-5 [&_ol]:list-decimal [&_ol_li]:mb-0.5
          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2
          [&_p]:mb-1 [&_p]:leading-relaxed"
      />
    </div>
  )
}

// ─── Dialog ────────────────────────────────────────────────────────────────

interface ModuleDialogProps {
  module: Partial<CurriculumModule> & Omit<CurriculumModule, 'id'>
  onClose: () => void
  onSave: (data: Omit<CurriculumModule, 'id'>) => void
}

function ModuleDialog({ module: initial, onClose, onSave }: ModuleDialogProps) {
  // Non-rich-text fields
  const [form, setForm] = useState({
    title:    initial.title    ?? '',
    icon:     initial.icon     ?? 'zap',
    day:      initial.day      ?? 1,
    duration: initial.duration ?? '',
    order:    initial.order    ?? 1,
    active:   initial.active   ?? true,
  })

  // Rich-text field values — refs so changes don't cause re-renders
  const descHtml    = useRef(initial.description ?? '')
  const topicsHtml  = useRef(toListHtml(initial.topics ?? []))
  const outcomesHtml = useRef(toListHtml(initial.outcomes ?? []))

  const descEditorRef    = useRef<HTMLDivElement>(null)
  const topicsEditorRef  = useRef<HTMLDivElement>(null)
  const outcomesEditorRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Read directly from the DOM element — most up-to-date source
    const description = descEditorRef.current?.innerHTML ?? descHtml.current
    const topics      = extractListItems(topicsEditorRef.current?.innerHTML  ?? topicsHtml.current)
    const outcomes    = extractListItems(outcomesEditorRef.current?.innerHTML ?? outcomesHtml.current)

    onSave({ ...form, description, topics, outcomes })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Centred container */}
      <div className="relative z-10 flex min-h-full items-start justify-center p-4 pt-8 pb-16">
        <div className="w-full max-w-5xl rounded-2xl border border-border bg-background shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              {(initial as CurriculumModule).id ? 'Edit Module' : 'Add Module'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">

            {/* Row 1: Title + Icon */}
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <div className="space-y-1.5">
                <Label htmlFor="mod-title">Title *</Label>
                <Input
                  id="mod-title"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Social Media Mastery"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mod-icon">Icon slug</Label>
                <Input
                  id="mod-icon"
                  value={form.icon}
                  onChange={e => set('icon', e.target.value)}
                  placeholder="e.g. share-2"
                />
                <p className="text-[10px] text-muted-foreground">Lucide icon name (kebab-case)</p>
              </div>
            </div>

            {/* Row 2: Day + Duration + Order + Active */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="mod-day">Day</Label>
                <select
                  id="mod-day"
                  value={form.day}
                  onChange={e => set('day', Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[1, 2, 3].map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mod-duration">Duration</Label>
                <Input
                  id="mod-duration"
                  value={form.duration}
                  onChange={e => set('duration', e.target.value)}
                  placeholder="e.g. 4 hours"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mod-order">Order</Label>
                <Input
                  id="mod-order"
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={e => set('order', Number(e.target.value))}
                />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex cursor-pointer items-center gap-2">
                  <div
                    onClick={() => set('active', !form.active)}
                    className={cn(
                      'relative h-6 w-11 cursor-pointer rounded-full transition-colors',
                      form.active ? 'bg-primary' : 'bg-input'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      form.active ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </div>
                  <span className="text-sm text-foreground">Active</span>
                </label>
              </div>
            </div>

            {/* Description — full-width rich text */}
            <RichField
              label="Description"
              defaultHtml={initial.description ?? ''}
              htmlRef={descHtml}
              editorRef={descEditorRef}
              minHeight={110}
              compact={false}
            />

            {/* Topics + Outcomes — side by side */}
            <div className="grid gap-5 sm:grid-cols-2">
              <RichField
                label="Topics Covered"
                defaultHtml={toListHtml(initial.topics ?? [])}
                htmlRef={topicsHtml}
                editorRef={topicsEditorRef}
                minHeight={200}
                compact
              />
              <RichField
                label="Learning Outcomes"
                defaultHtml={toListHtml(initial.outcomes ?? [])}
                htmlRef={outcomesHtml}
                editorRef={outcomesEditorRef}
                minHeight={200}
                compact
              />
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Press <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to add new items in the Topics / Outcomes editors.
              Use <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+B</kbd> bold ·
              <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+I</kbd> italic ·
              <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+U</kbd> underline.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">
                <Check className="mr-2 h-4 w-4" />
                Save Module
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CurriculumPage() {
  const storeReady = useStoreReady()
  const [modules, setModules] = useState<CurriculumModule[]>([])

  // Incremented on each open so ModuleDialog is always freshly mounted
  const [dialogKey, setDialogKey] = useState(0)
  const [dialog, setDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    data: (Omit<CurriculumModule, 'id'> & Partial<Pick<CurriculumModule, 'id'>>) | null
  }>({ open: false, mode: 'create', data: null })

  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  const load = useCallback(() => setModules(getAllCurriculum()), [])

  useEffect(() => { if (storeReady) load() }, [storeReady, load])

  const openCreate = () => {
    setDialogKey(k => k + 1)
    setDialog({ open: true, mode: 'create', data: { ...EMPTY_MODULE, order: modules.length + 1 } })
  }

  const openEdit = (mod: CurriculumModule) => {
    setDialogKey(k => k + 1)
    setDialog({ open: true, mode: 'edit', data: { ...mod } })
  }

  const closeDialog = () => setDialog(d => ({ ...d, open: false }))

  const handleSave = (data: Omit<CurriculumModule, 'id'>) => {
    if (dialog.mode === 'edit' && dialog.data && 'id' in dialog.data && dialog.data.id) {
      updateCurriculumModule(dialog.data.id, data)
    } else {
      createCurriculumModule(data)
    }
    load()
    closeDialog()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this module?')) return
    deleteCurriculumModule(id)
    load()
  }

  const moveModule = (id: string, direction: 'up' | 'down') => {
    const mod = modules.find(m => m.id === id)
    if (!mod) return
    const dayMods = modules.filter(m => m.day === mod.day)
    const dayIdx = dayMods.findIndex(m => m.id === id)
    if (direction === 'up' && dayIdx === 0) return
    if (direction === 'down' && dayIdx === dayMods.length - 1) return
    const swapMod = dayMods[direction === 'up' ? dayIdx - 1 : dayIdx + 1]
    updateCurriculumModule(mod.id, { order: swapMod.order })
    updateCurriculumModule(swapMod.id, { order: mod.order })
    load()
  }

  const toggleActive = (mod: CurriculumModule) => {
    updateCurriculumModule(mod.id, { active: !mod.active })
    load()
  }

  const handleFlush = async () => {
    setSaving(true)
    setSaveState('idle')
    try {
      await flushCurriculumModules()
      setSaveState('saved')
    } catch {
      setSaveState('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  const days = [...new Set(modules.map(m => m.day))].filter(Boolean).sort((a, b) => a - b)

  return (
    <AdminLayout requiredPermission="settings.manage">
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Curriculum</h1>
              <p className="text-sm text-muted-foreground">Manage learning modules shown on the website</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreate} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
            <Button onClick={handleFlush} size="sm" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : saveState === 'saved' ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? 'Saving…' : saveState === 'saved' ? 'Saved!' : 'Save to Cloud'}
            </Button>
          </div>
        </div>

        {/* Feedback banners */}
        {saveState === 'error' && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Failed to save. Check your connection and try again.
          </div>
        )}
        {saveState === 'saved' && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            Curriculum saved successfully.
          </div>
        )}

        {/* Modules grouped by day */}
        {days.map(day => {
          const dayMods = modules.filter(m => m.day === day)
          return (
            <div key={day}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="h-3.5 w-0.5 rounded-full bg-primary" />
                Day {day}
                <span className="text-xs normal-case font-normal">— {dayMods.length} module{dayMods.length !== 1 ? 's' : ''}</span>
              </h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="w-8 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Module</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Duration</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Topics</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dayMods.map((mod, i) => (
                      <tr key={mod.id} className="group transition-colors hover:bg-secondary/20">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{mod.order}</td>
                        <td className="px-4 py-3">
                          <p className={cn('font-medium', !mod.active && 'text-muted-foreground line-through')}>{mod.title}</p>
                          {/* Use <div> not <p> — description may contain block-level HTML */}
                          <div
                            className="mt-0.5 line-clamp-1 text-xs text-muted-foreground [&_strong]:font-bold [&_em]:italic [&_*]:inline"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(mod.description) }}
                          />
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{mod.duration || '—'}</td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <Badge className="bg-secondary text-foreground">{mod.topics.length} topics</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(mod)}
                            className={cn('relative h-5 w-9 rounded-full transition-colors', mod.active ? 'bg-primary' : 'bg-input')}
                          >
                            <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', mod.active ? 'translate-x-4' : 'translate-x-0.5')} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => moveModule(mod.id, 'up')} disabled={i === 0} title="Move up"
                              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30">
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button onClick={() => moveModule(mod.id, 'down')} disabled={i === dayMods.length - 1} title="Move down"
                              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30">
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button onClick={() => openEdit(mod)} title="Edit"
                              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(mod.id)} title="Delete"
                              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {modules.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No modules yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Add your first curriculum module to get started</p>
            <Button onClick={openCreate} variant="outline" size="sm" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
        )}

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">How changes work</p>
          Edit, reorder, and toggle modules instantly. Click{' '}
          <strong className="text-foreground">&ldquo;Save to Cloud&rdquo;</strong> to persist everything to the database
          so changes appear on the live website for all visitors.
        </div>
      </div>

      {/* Dialog — keyed so it's always freshly mounted, preventing stale refs */}
      {dialog.open && dialog.data && (
        <ModuleDialog
          key={dialogKey}
          module={dialog.data as Omit<CurriculumModule, 'id'> & Partial<Pick<CurriculumModule, 'id'>>}
          onClose={closeDialog}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  )
}

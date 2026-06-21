'use client'

import { useState, useEffect } from 'react'
import {
  Share2, Settings, Brain, Users, BarChart2, Target, Megaphone, Bot,
  Zap, Workflow, Lightbulb, Users2, BookOpen, Code2, Globe, TrendingUp,
  Smartphone, Monitor, Database, Search, Mail, Star, Award, Briefcase,
  ChevronDown, ChevronRight, Check, Clock, Calendar, GraduationCap,
  type LucideIcon,
} from 'lucide-react'
import { getCurriculum } from '@/lib/store'
import { useStoreReady } from '@/components/store-provider'
import type { CurriculumModule } from '@/lib/types'
import { cn, sanitizeHtml } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  'share-2': Share2, 'share': Share2,
  'cog': Settings, 'settings': Settings,
  'brain': Brain,
  'users': Users, 'users-2': Users2,
  'bar-chart-2': BarChart2, 'bar-chart': BarChart2,
  'target': Target,
  'megaphone': Megaphone,
  'bot': Bot,
  'zap': Zap,
  'workflow': Workflow,
  'lightbulb': Lightbulb,
  'book-open': BookOpen, 'book': BookOpen,
  'code-2': Code2, 'code': Code2,
  'globe': Globe,
  'trending-up': TrendingUp,
  'smartphone': Smartphone,
  'monitor': Monitor,
  'database': Database,
  'search': Search,
  'mail': Mail,
  'star': Star,
  'award': Award,
  'briefcase': Briefcase,
}

// Fully pre-defined palettes — no dynamic class construction so Tailwind includes all
const PALETTE = [
  {
    text: 'text-violet-500',
    bg: 'bg-violet-500/10',
    activeBg: 'bg-violet-500/5',
    border: 'border-violet-500',
    badge: 'bg-violet-500',
    bar: 'bg-violet-500',
  },
  {
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    activeBg: 'bg-blue-500/5',
    border: 'border-blue-500',
    badge: 'bg-blue-500',
    bar: 'bg-blue-500',
  },
  {
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    activeBg: 'bg-emerald-500/5',
    border: 'border-emerald-500',
    badge: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
  {
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    activeBg: 'bg-amber-500/5',
    border: 'border-amber-500',
    badge: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  {
    text: 'text-rose-500',
    bg: 'bg-rose-500/10',
    activeBg: 'bg-rose-500/5',
    border: 'border-rose-500',
    badge: 'bg-rose-500',
    bar: 'bg-rose-500',
  },
  {
    text: 'text-teal-500',
    bg: 'bg-teal-500/10',
    activeBg: 'bg-teal-500/5',
    border: 'border-teal-500',
    badge: 'bg-teal-500',
    bar: 'bg-teal-500',
  },
  {
    text: 'text-orange-500',
    bg: 'bg-orange-500/10',
    activeBg: 'bg-orange-500/5',
    border: 'border-orange-500',
    badge: 'bg-orange-500',
    bar: 'bg-orange-500',
  },
  {
    text: 'text-pink-500',
    bg: 'bg-pink-500/10',
    activeBg: 'bg-pink-500/5',
    border: 'border-pink-500',
    badge: 'bg-pink-500',
    bar: 'bg-pink-500',
  },
]

function getAccent(index: number) {
  return PALETTE[index % PALETTE.length]
}

function getIcon(slug: string): LucideIcon {
  return ICON_MAP[slug] ?? Zap
}

export function WhatYouWillLearn() {
  const storeReady = useStoreReady()
  const [modules, setModules] = useState<CurriculumModule[]>([])
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const [activeId, setActiveId] = useState('')
  const [openMobileId, setOpenMobileId] = useState('')

  useEffect(() => {
    const mods = getCurriculum()
    setModules(mods)
    if (mods.length > 0) {
      setActiveId(mods[0].id)
      setOpenMobileId(mods[0].id)
    }
  }, [storeReady])

  const days = [...new Set(modules.map(m => m.day))].filter(Boolean).sort((a, b) => a - b)

  const filtered = activeDay === null ? modules : modules.filter(m => m.day === activeDay)

  const activeModule = filtered.find(m => m.id === activeId) ?? filtered[0]

  const totalTopics = modules.reduce((s, m) => s + m.topics.length, 0)

  return (
    <section id="curriculum" className="border-b border-border py-20 lg:py-28 bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <GraduationCap className="h-4 w-4" />
            <span>Comprehensive Curriculum</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            What You Will <span className="text-primary">Learn</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A practical, hands-on curriculum designed to take you from basics to mastery across
            the core pillars of modern digital business.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Modules', value: modules.length || '—', icon: BookOpen, palette: PALETTE[0] },
            { label: 'Topics Covered', value: totalTopics > 0 ? `${totalTopics}+` : '—', icon: Check, palette: PALETTE[2] },
            { label: 'Intensive Days', value: days.length || '—', icon: Calendar, palette: PALETTE[1] },
            { label: 'Certificate', value: 'Included', icon: Award, palette: PALETTE[3] },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="group rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={cn('mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl', stat.palette.bg)}>
                  <Icon className={cn('h-5 w-5', stat.palette.text)} />
                </div>
                <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Day filter */}
        {days.length > 1 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => {
                setActiveDay(null)
                if (modules[0]) setActiveId(modules[0].id)
              }}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-all duration-150',
                activeDay === null
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              All Modules
            </button>
            {days.map(day => (
              <button
                key={day}
                onClick={() => {
                  setActiveDay(day)
                  const first = modules.find(m => m.day === day)
                  if (first) setActiveId(first.id)
                }}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-all duration-150',
                  activeDay === day
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                Day {day}
              </button>
            ))}
          </div>
        )}

        {/* Desktop: split panel */}
        <div className="hidden lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr] gap-5 min-h-[520px]">

          {/* Left: module list */}
          <div className="flex flex-col gap-2">
            {filtered.map(mod => {
              const globalIdx = modules.findIndex(m => m.id === mod.id)
              const a = getAccent(globalIdx)
              const Icon = getIcon(mod.icon)
              const isActive = activeId === mod.id
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveId(mod.id)}
                  className={cn(
                    'group w-full rounded-xl border-l-[3px] p-4 text-left transition-all duration-200',
                    isActive
                      ? cn('border-l-current shadow-sm bg-card border border-border/60', a.border, a.activeBg)
                      : 'border-l-transparent border border-transparent bg-card/40 hover:bg-card hover:border-border/60 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors', a.bg)}>
                      <Icon className={cn('h-4 w-4', a.text)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-sm font-semibold text-foreground">{mod.title}</span>
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 transition-all duration-200',
                            isActive ? cn('rotate-90', a.text) : 'text-muted-foreground/50 group-hover:text-muted-foreground'
                          )}
                        />
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{mod.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {mod.day > 0 && (
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', a.bg, a.text)}>
                            Day {mod.day}
                          </span>
                        )}
                        {mod.duration && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {mod.duration}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{mod.topics.length} topics</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: module detail */}
          {activeModule && (() => {
            const globalIdx = modules.findIndex(m => m.id === activeModule.id)
            const a = getAccent(globalIdx)
            const Icon = getIcon(activeModule.icon)
            const num = String(globalIdx + 1).padStart(2, '0')
            return (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Gradient header */}
                <div className={cn('p-7', a.bg, 'border-b border-border/50')}>
                  <div className="flex items-start gap-5">
                    <div className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-border/30 bg-background shadow-sm')}>
                      <Icon className={cn('h-8 w-8', a.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-foreground leading-tight">{activeModule.title}</h3>
                      <div
                        className="mt-1.5 text-muted-foreground leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeModule.description) }}
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {activeModule.day > 0 && (
                          <span className={cn('rounded-full px-3 py-1 text-xs font-bold text-white', a.badge)}>
                            Day {activeModule.day}
                          </span>
                        )}
                        {activeModule.duration && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {activeModule.duration}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          {activeModule.topics.length} topics
                        </span>
                      </div>
                    </div>
                    <div className={cn('hidden xl:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white/90 shadow-inner', a.badge)}>
                      {num}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid lg:grid-cols-2 divide-x divide-border">
                  {/* Topics */}
                  <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <span className={cn('h-4 w-1 rounded-full', a.bar)} />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Topics Covered</h4>
                    </div>
                    <ul className="space-y-3">
                      {activeModule.topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-3 group/topic">
                          <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', a.bg)}>
                            <Check className={cn('h-3 w-3', a.text)} />
                          </div>
                          <span
                            className="text-sm text-muted-foreground transition-colors group-hover/topic:text-foreground [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(topic) }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Outcomes */}
                  <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <span className={cn('h-4 w-1 rounded-full', a.bar)} />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">You Will Be Able To</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {activeModule.outcomes.map((outcome, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-lg bg-secondary/40 p-3 transition-colors hover:bg-secondary/70">
                          <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', a.badge)}>
                            {i + 1}
                          </div>
                          <span
                            className="text-sm leading-snug text-foreground [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(outcome) }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Mobile: Accordion */}
        <div className="space-y-3 lg:hidden">
          {filtered.map(mod => {
            const globalIdx = modules.findIndex(m => m.id === mod.id)
            const a = getAccent(globalIdx)
            const Icon = getIcon(mod.icon)
            const isOpen = openMobileId === mod.id
            return (
              <div
                key={mod.id}
                className={cn(
                  'overflow-hidden rounded-xl border transition-all duration-200',
                  isOpen ? 'border-border shadow-sm' : 'border-border/60'
                )}
              >
                <button
                  onClick={() => setOpenMobileId(isOpen ? '' : mod.id)}
                  className="flex w-full items-center gap-3 bg-card p-4 text-left"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', a.bg)}>
                    <Icon className={cn('h-4 w-4', a.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{mod.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {mod.day > 0 && (
                        <span className={cn('text-[10px] font-semibold', a.text)}>Day {mod.day}</span>
                      )}
                      {mod.duration && (
                        <span className="text-[10px] text-muted-foreground">{mod.duration}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-card/60 px-4 py-4 space-y-4">
                    <div
                      className="text-sm text-muted-foreground leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:pl-4 [&_ol]:list-decimal"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(mod.description) }}
                    />
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span className={cn('h-3 w-1 rounded-full', a.bar)} />
                        Topics
                      </h5>
                      <ul className="space-y-1.5">
                        {mod.topics.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0 flex-none', a.text)} />
                            <span
                              className="[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(t) }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span className={cn('h-3 w-1 rounded-full', a.bar)} />
                        You Will Be Able To
                      </h5>
                      <ul className="space-y-2">
                        {mod.outcomes.map((o, i) => (
                          <li key={i} className="flex items-start gap-2.5 rounded-lg bg-secondary/50 p-2.5">
                            <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', a.badge)}>
                              {i + 1}
                            </div>
                            <span
                              className="text-sm text-foreground leading-snug [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(o) }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom note */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          All sessions include{' '}
          <strong className="font-semibold text-foreground">practical exercises</strong>,{' '}
          <strong className="font-semibold text-foreground">real-world case studies</strong>, and{' '}
          <strong className="font-semibold text-foreground">take-home templates</strong>.
        </p>

      </div>
    </section>
  )
}

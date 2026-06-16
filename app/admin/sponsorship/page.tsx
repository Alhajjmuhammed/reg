'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Star,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Save,
  Building2,
  LayoutTemplate,
  Settings2,
  GraduationCap,
  Upload,
  FileText,
  X,
} from 'lucide-react'
import {
  getAllSponsorshipTiers,
  createSponsorshipTier,
  updateSponsorshipTier,
  deleteSponsorshipTier,
  getAllSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  getSponsorshipSettings,
  updateSponsorshipSettings,
  getAllAcademicPartners,
  createAcademicPartner,
  updateAcademicPartner,
  deleteAcademicPartner,
  getAcademicPartnerSettings,
  updateAcademicPartnerSettings,
  getSponsorshipApplications,
  updateSponsorshipApplication,
  deleteSponsorshipApplication,
} from '@/lib/store'
import type { SponsorshipTier, Sponsor, SponsorshipPageSettings, SponsorshipTierColor, AcademicPartner, AcademicPartnerSettings, SponsorshipApplication } from '@/lib/types'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/utils'

const TIER_COLORS: { value: SponsorshipTierColor; label: string; dot: string }[] = [
  { value: 'platinum', label: 'Platinum', dot: 'bg-slate-500' },
  { value: 'gold',     label: 'Gold',     dot: 'bg-yellow-500' },
  { value: 'silver',   label: 'Silver',   dot: 'bg-gray-400' },
  { value: 'bronze',   label: 'Bronze',   dot: 'bg-orange-600' },
  { value: 'custom',   label: 'Custom',   dot: 'bg-primary' },
]

const emptyTier: Omit<SponsorshipTier, 'id'> = {
  name: '',
  color: 'gold',
  price: 0,
  currency: 'TZS',
  description: '',
  benefits: [
    { text: 'Logo on event materials', included: true },
    { text: 'Complimentary registrations', included: true },
    { text: 'Social media mention', included: true },
  ],
  highlighted: false,
  active: true,
  order: 99,
}

const emptySponsor: Omit<Sponsor, 'id'> = {
  name: '',
  description: '',
  logoUrl: '',
  bannerUrl: '',
  websiteUrl: '',
  tierId: '',
  active: true,
}

const emptyAcademicPartner: Omit<AcademicPartner, 'id'> = {
  name: '',
  description: '',
  logoUrl: '',
  bannerUrl: '',
  websiteUrl: '',
  active: true,
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-TZ', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' TZS'
}

export default function AdminSponsorshipPage() {
  const [tiers, setTiers] = useState<SponsorshipTier[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [settings, setSettings] = useState<SponsorshipPageSettings | null>(null)
  const [mounted, setMounted] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Tier dialog
  const [tierDialog, setTierDialog] = useState(false)
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null)
  const [tierForm, setTierForm] = useState<Omit<SponsorshipTier, 'id'>>({ ...emptyTier })
  const [newBenefit, setNewBenefit] = useState('')

  // Sponsor dialog
  const [sponsorDialog, setSponsorDialog] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [sponsorForm, setSponsorForm] = useState<Omit<Sponsor, 'id'>>({ ...emptySponsor })

  // Sponsorship applications
  const [applications, setApplications] = useState<SponsorshipApplication[]>([])

  // Academic partners
  const [academicPartners, setAcademicPartners] = useState<AcademicPartner[]>([])
  const [academicSettings, setAcademicSettings] = useState<AcademicPartnerSettings>({ sectionTitle: 'Academic Partner', sectionDescription: 'Recognised institution that endorses our curriculum' })
  const [academicDialog, setAcademicDialog] = useState(false)
  const [editingAcademic, setEditingAcademic] = useState<AcademicPartner | null>(null)
  const [academicForm, setAcademicForm] = useState<Omit<AcademicPartner, 'id'>>({ ...emptyAcademicPartner })
  const [deleteAcademicId, setDeleteAcademicId] = useState<string | null>(null)

  // Image upload helper
  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleImageUpload = async (field: 'logoUrl' | 'bannerUrl', file: File) => {
    const dataUrl = await readFileAsDataURL(file)
    setSponsorForm(f => ({ ...f, [field]: dataUrl }))
  }

  const handleAcademicImageUpload = async (field: 'logoUrl' | 'bannerUrl', file: File) => {
    const dataUrl = await readFileAsDataURL(file)
    setAcademicForm(f => ({ ...f, [field]: dataUrl }))
  }

  const handleProposalUpload = async (file: File) => {
    const dataUrl = await readFileAsDataURL(file)
    setSettings(s => s ? { ...s, proposalFileUrl: dataUrl, proposalFileName: file.name } : s)
  }

  // Delete confirms
  const [deleteTierId, setDeleteTierId] = useState<string | null>(null)
  const [deleteSponsorId, setDeleteSponsorId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    setTiers(getAllSponsorshipTiers())
    setSponsors(getAllSponsors())
    setSettings(getSponsorshipSettings())
    setAcademicPartners(getAllAcademicPartners())
    setAcademicSettings(getAcademicPartnerSettings())
    setApplications(getSponsorshipApplications())
  }, [])

  const showSave = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000) }
  const refreshTiers = () => setTiers(getAllSponsorshipTiers())
  const refreshSponsors = () => setSponsors(getAllSponsors())

  // ---- Tier CRUD ----
  const openAddTier = () => {
    setEditingTier(null)
    setTierForm({ ...emptyTier, order: tiers.length + 1 })
    setTierDialog(true)
  }
  const openEditTier = (t: SponsorshipTier) => {
    setEditingTier(t)
    setTierForm({ name: t.name, color: t.color, customColor: t.customColor, price: t.price, currency: t.currency, description: t.description, benefits: [...t.benefits.map(b => ({ ...b }))], highlighted: t.highlighted, active: t.active, order: t.order })
    setTierDialog(true)
  }
  const saveTier = () => {
    if (!tierForm.name.trim()) return
    if (editingTier) {
      updateSponsorshipTier(editingTier.id, tierForm)
    } else {
      createSponsorshipTier(tierForm)
    }
    setTierDialog(false)
    refreshTiers()
    showSave('Tier saved!')
  }
  const handleDeleteTier = (id: string) => {
    deleteSponsorshipTier(id)
    setDeleteTierId(null)
    refreshTiers()
  }
  const addBenefit = () => {
    if (!newBenefit.trim()) return
    setTierForm(f => ({ ...f, benefits: [...f.benefits, { text: newBenefit.trim(), included: true }] }))
    setNewBenefit('')
  }
  const toggleBenefit = (i: number) => {
    setTierForm(f => {
      const b = [...f.benefits]
      b[i] = { ...b[i], included: !b[i].included }
      return { ...f, benefits: b }
    })
  }
  const removeBenefit = (i: number) => {
    setTierForm(f => ({ ...f, benefits: f.benefits.filter((_, idx) => idx !== i) }))
  }

  // ---- Sponsor CRUD ----
  const openAddSponsor = () => {
    setEditingSponsor(null)
    setSponsorForm({ ...emptySponsor, tierId: tiers[0]?.id || '' })
    setSponsorDialog(true)
  }
  const openEditSponsor = (s: Sponsor) => {
    setEditingSponsor(s)
    setSponsorForm({ name: s.name, description: s.description || '', logoUrl: s.logoUrl, bannerUrl: s.bannerUrl || '', websiteUrl: s.websiteUrl || '', tierId: s.tierId, active: s.active })
    setSponsorDialog(true)
  }
  const saveSponsor = () => {
    if (!sponsorForm.name.trim()) return
    if (editingSponsor) {
      updateSponsor(editingSponsor.id, sponsorForm)
    } else {
      createSponsor(sponsorForm)
    }
    setSponsorDialog(false)
    refreshSponsors()
    showSave('Sponsor saved!')
  }
  const handleDeleteSponsor = (id: string) => {
    deleteSponsor(id)
    setDeleteSponsorId(null)
    refreshSponsors()
  }

  // ---- Academic Partner Settings ----
  const saveAcademicSettings = () => {
    updateAcademicPartnerSettings(academicSettings)
    showSave('Section settings saved!')
  }

  // ---- Academic Partner CRUD ----
  const refreshAcademic = () => setAcademicPartners(getAllAcademicPartners())
  const openAddAcademic = () => {
    setEditingAcademic(null)
    setAcademicForm({ ...emptyAcademicPartner })
    setAcademicDialog(true)
  }
  const openEditAcademic = (p: AcademicPartner) => {
    setEditingAcademic(p)
    setAcademicForm({ name: p.name, description: p.description, logoUrl: p.logoUrl, bannerUrl: p.bannerUrl || '', websiteUrl: p.websiteUrl || '', active: p.active })
    setAcademicDialog(true)
  }
  const saveAcademic = () => {
    if (!academicForm.name.trim()) return
    if (editingAcademic) {
      updateAcademicPartner(editingAcademic.id, academicForm)
    } else {
      createAcademicPartner(academicForm)
    }
    setAcademicDialog(false)
    refreshAcademic()
    showSave('Academic partner saved!')
  }
  const handleDeleteAcademic = (id: string) => {
    deleteAcademicPartner(id)
    setDeleteAcademicId(null)
    refreshAcademic()
  }

  // ---- Settings save ----
  const saveSettings = () => {
    if (!settings) return
    updateSponsorshipSettings(settings)
    showSave('Page settings saved!')
  }

  if (!mounted || !settings) return null

  const getTierName = (id: string) => tiers.find(t => t.id === id)?.name || 'Unknown'

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sponsorship</h1>
            <p className="text-sm text-muted-foreground">Manage tiers, sponsors, and page content</p>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">{saveMsg}</span>}
            <Button variant="outline" size="sm" asChild>
              <a href="/sponsorship" target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View Page
              </a>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tiers">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="tiers" className="gap-1.5">
              <Star className="h-3.5 w-3.5" /> Tiers
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Sponsors
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Academic Partners
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Applications
              {applications.length > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {applications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings2 className="h-3.5 w-3.5" /> Page Settings
            </TabsTrigger>
          </TabsList>

          {/* ---- TIERS ---- */}
          <TabsContent value="tiers" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{tiers.length} tier{tiers.length !== 1 ? 's' : ''} configured</p>
              <Button onClick={openAddTier} className="gap-2">
                <Plus className="h-4 w-4" /> Add Tier
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tiers.map(tier => {
                const colorDot = TIER_COLORS.find(c => c.value === tier.color)?.dot || 'bg-primary'
                return (
                  <Card key={tier.id} className={cn('relative', !tier.active && 'opacity-50')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-3 w-3 rounded-full', colorDot)} />
                          <CardTitle className="text-base">{tier.name}</CardTitle>
                          {tier.highlighted && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTier(tier)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTierId(tier.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary">{formatCurrency(tier.price)}</div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">{tier.description}</p>
                      <div className="space-y-1">
                        {tier.benefits.slice(0, 4).map((b, i) => (
                          <div key={i} className={cn('flex items-center gap-1.5 text-xs', !b.included && 'opacity-40')}>
                            {b.included
                              ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                              : <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                            }
                            <span className={b.included ? '' : 'line-through text-muted-foreground'}>{b.text}</span>
                          </div>
                        ))}
                        {tier.benefits.length > 4 && (
                          <p className="text-xs text-muted-foreground pl-4">+{tier.benefits.length - 4} more</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          checked={tier.active}
                          onCheckedChange={(v) => { updateSponsorshipTier(tier.id, { active: v }); refreshTiers() }}
                          aria-label="Toggle tier active"
                        />
                        <span className="text-xs text-muted-foreground">{tier.active ? 'Active' : 'Hidden'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {tiers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No tiers yet. Add your first sponsorship tier.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ---- SPONSORS ---- */}
          <TabsContent value="sponsors" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}</p>
              <Button onClick={openAddSponsor} className="gap-2">
                <Plus className="h-4 w-4" /> Add Sponsor
              </Button>
            </div>
            <div className="rounded-lg border divide-y">
              {sponsors.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No sponsors added yet.</p>
                </div>
              ) : (
                sponsors.map(sponsor => (
                  <div key={sponsor.id} className={cn('flex items-center gap-4 px-4 py-3', !sponsor.active && 'opacity-50')}>
                    {/* Logo preview */}
                    {sponsor.logoUrl ? (
                      <img src={assetUrl(sponsor.logoUrl)} alt={sponsor.name} className="h-10 w-20 object-contain rounded" />
                    ) : (
                      <div className="h-10 w-20 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{sponsor.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">{getTierName(sponsor.tierId)}</Badge>
                        {sponsor.websiteUrl && (
                          <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="h-2.5 w-2.5" /> Website
                          </a>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={sponsor.active}
                      onCheckedChange={(v) => { updateSponsor(sponsor.id, { active: v }); refreshSponsors() }}
                      aria-label="Toggle sponsor active"
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSponsor(sponsor)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteSponsorId(sponsor.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ---- ACADEMIC PARTNERS ---- */}
          <TabsContent value="academic" className="space-y-6 mt-6">
            {/* Section heading settings */}
            <Card>
              <CardHeader>
                <CardTitle>Section Heading</CardTitle>
                <CardDescription>Title and description shown above the academic partner card on the home page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    placeholder="e.g. Academic Partner"
                    value={academicSettings.sectionTitle}
                    onChange={e => setAcademicSettings(s => ({ ...s, sectionTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Description</Label>
                  <Input
                    placeholder="e.g. Recognised institution that endorses our curriculum"
                    value={academicSettings.sectionDescription}
                    onChange={e => setAcademicSettings(s => ({ ...s, sectionDescription: e.target.value }))}
                  />
                </div>
                <Button onClick={saveAcademicSettings} size="sm" className="gap-2">
                  <Save className="h-4 w-4" /> Save Section Settings
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{academicPartners.length} academic partner{academicPartners.length !== 1 ? 's' : ''}</p>
              <Button onClick={openAddAcademic} className="gap-2">
                <Plus className="h-4 w-4" /> Add Academic Partner
              </Button>
            </div>
            <div className="rounded-lg border divide-y">
              {academicPartners.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No academic partners added yet.</p>
                </div>
              ) : (
                academicPartners.map(partner => (
                  <div key={partner.id} className={cn('flex items-center gap-4 px-4 py-3', !partner.active && 'opacity-50')}>
                    {partner.logoUrl ? (
                      <img src={partner.logoUrl} alt={partner.name} className="h-10 w-20 object-contain rounded" />
                    ) : (
                      <div className="h-10 w-20 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{partner.name}</p>
                      {partner.websiteUrl && (
                        <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                          <ExternalLink className="h-2.5 w-2.5" /> Website
                        </a>
                      )}
                    </div>
                    <Switch
                      checked={partner.active}
                      onCheckedChange={(v) => { updateAcademicPartner(partner.id, { active: v }); refreshAcademic() }}
                      aria-label="Toggle academic partner active"
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditAcademic(partner)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteAcademicId(partner.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ---- PAGE SETTINGS ---- */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Text shown at the top of the sponsorship page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Active</Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.pageActive}
                      onCheckedChange={(v) => setSettings(s => s ? { ...s, pageActive: v } : s)}
                    />
                    <span className="text-sm text-muted-foreground">{settings.pageActive ? 'Sponsorship page is public' : 'Page is hidden from visitors'}</span>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hero Title</Label>
                    <Input value={settings.heroTitle} onChange={e => setSettings(s => s ? { ...s, heroTitle: e.target.value } : s)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subtitle / Badge</Label>
                    <Input value={settings.heroSubtitle} onChange={e => setSettings(s => s ? { ...s, heroSubtitle: e.target.value } : s)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hero Description</Label>
                  <Textarea rows={3} value={settings.heroDescription} onChange={e => setSettings(s => s ? { ...s, heroDescription: e.target.value } : s)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Sponsor Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={settings.whyTitle} onChange={e => setSettings(s => s ? { ...s, whyTitle: e.target.value } : s)} />
                </div>
                <div className="space-y-2">
                  <Label>Section Description</Label>
                  <Textarea rows={2} value={settings.whyDescription} onChange={e => setSettings(s => s ? { ...s, whyDescription: e.target.value } : s)} />
                </div>
                <div>
                  <Label className="mb-3 block">Stats (4 items)</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {settings.whyStats.map((stat, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder="Value (e.g. 500+)"
                          value={stat.value}
                          onChange={e => setSettings(s => {
                            if (!s) return s
                            const st = [...s.whyStats]
                            st[i] = { ...st[i], value: e.target.value }
                            return { ...s, whyStats: st }
                          })}
                          className="w-28"
                        />
                        <Input
                          placeholder="Label"
                          value={stat.label}
                          onChange={e => setSettings(s => {
                            if (!s) return s
                            const st = [...s.whyStats]
                            st[i] = { ...st[i], label: e.target.value }
                            return { ...s, whyStats: st }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>Shown in the contact CTA section</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Sponsorship Email</Label>
                  <Input type="email" value={settings.contactEmail} onChange={e => setSettings(s => s ? { ...s, contactEmail: e.target.value } : s)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.contactPhone} onChange={e => setSettings(s => s ? { ...s, contactPhone: e.target.value } : s)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp (digits only)</Label>
                  <Input value={settings.contactWhatsApp} onChange={e => setSettings(s => s ? { ...s, contactWhatsApp: e.target.value } : s)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sponsorship Proposal</CardTitle>
                <CardDescription>Upload a PDF or document that visitors can download from the sponsorship page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Proposal Title</Label>
                  <Input
                    placeholder="e.g. Sponsorship Proposal 2024"
                    value={settings.proposalTitle || ''}
                    onChange={e => setSettings(s => s ? { ...s, proposalTitle: e.target.value } : s)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Proposal File</Label>
                  {settings.proposalFileUrl ? (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="flex-1 text-sm text-foreground truncate">
                        {settings.proposalFileName || 'Proposal uploaded'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                        onClick={() => setSettings(s => s ? { ...s, proposalFileUrl: undefined, proposalFileName: undefined } : s)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 hover:border-primary hover:bg-muted/30 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Click to upload proposal</p>
                        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX — stored and served to visitors</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleProposalUpload(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveSettings} className="gap-2">
              <Save className="h-4 w-4" /> Save Page Settings
            </Button>
          </TabsContent>

          {/* ---- APPLICATIONS ---- */}
          <TabsContent value="applications" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Sponsorship Applications</h3>
                <p className="text-sm text-muted-foreground">Submitted by companies via the sponsorship page</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setApplications(getSponsorshipApplications())}>
                Refresh
              </Button>
            </div>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border rounded-xl">
                <FileText className="h-10 w-10 mb-3 opacity-20" />
                <p className="font-medium">No applications yet</p>
                <p className="text-sm">Applications submitted on the sponsorship page will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <Card key={app.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{app.companyName}</p>
                            <span className="text-xs text-muted-foreground font-mono">{app.invoiceNumber}</span>
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              app.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                              app.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            )}>
                              {app.status}
                            </span>
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              app.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            )}>
                              {app.paymentStatus}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{app.contactName} · {app.contactEmail}</span>
                            <span>{app.contactPhone}</span>
                            <span className="font-medium text-foreground">{app.tierName} — {new Intl.NumberFormat('en-TZ').format(app.amount)} {app.currency}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            <span>Payment: {app.paymentMethod.replace('-', ' ')} · Ref: <span className="font-mono">{app.paymentReference}</span></span>
                            <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                          </div>
                          {app.notes && <p className="text-xs text-muted-foreground italic">"{app.notes}"</p>}
                          {app.receiptUrl && (
                            <a href={app.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-1">
                              <img src={app.receiptUrl} alt="Payment receipt" className="h-16 w-auto rounded border border-border object-contain hover:opacity-80 transition-opacity" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                            value={app.status}
                            onChange={e => {
                              updateSponsorshipApplication(app.id, { status: e.target.value as SponsorshipApplication['status'] })
                              setApplications(getSponsorshipApplications())
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <select
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                            value={app.paymentStatus}
                            onChange={e => {
                              updateSponsorshipApplication(app.id, { paymentStatus: e.target.value as SponsorshipApplication['paymentStatus'] })
                              setApplications(getSponsorshipApplications())
                            }}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`Delete application from ${app.companyName}?`)) {
                                deleteSponsorshipApplication(app.id)
                                setApplications(getSponsorshipApplications())
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ---- Tier Dialog ---- */}
      <Dialog open={tierDialog} onOpenChange={setTierDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Edit Tier' : 'Add Tier'}</DialogTitle>
            <DialogDescription>Configure the sponsorship package details and benefits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tier Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Gold" value={tierForm.name} onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={tierForm.color} onValueChange={(v: SponsorshipTierColor) => setTierForm(f => ({ ...f, color: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_COLORS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-3 w-3 rounded-full', c.dot)} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price (TZS)</Label>
                <Input type="number" min={0} value={tierForm.price} onChange={e => setTierForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" min={1} value={tierForm.order} onChange={e => setTierForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} value={tierForm.description} onChange={e => setTierForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-3">
              <Label>Benefits</Label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {tierForm.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Switch checked={b.included} onCheckedChange={() => toggleBenefit(i)} aria-label="Included" />
                    <span className={cn('flex-1 text-sm', !b.included && 'line-through text-muted-foreground')}>{b.text}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeBenefit(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add benefit..."
                  value={newBenefit}
                  onChange={e => setNewBenefit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" variant="outline" onClick={addBenefit}>Add</Button>
              </div>
            </div>
            <div className="flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch checked={tierForm.highlighted} onCheckedChange={v => setTierForm(f => ({ ...f, highlighted: v }))} />
                <Label>Show as &quot;Most Popular&quot;</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={tierForm.active} onCheckedChange={v => setTierForm(f => ({ ...f, active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialog(false)}>Cancel</Button>
            <Button onClick={saveTier} disabled={!tierForm.name.trim()}>
              {editingTier ? 'Save Changes' : 'Add Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Sponsor Dialog ---- */}
      <Dialog open={sponsorDialog} onOpenChange={setSponsorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}</DialogTitle>
            <DialogDescription>Sponsor details — logo will appear on the public page</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Company Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. CRDB Bank" value={sponsorForm.name} onChange={e => setSponsorForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Short description shown in the partners carousel..." value={sponsorForm.description} onChange={e => setSponsorForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Partner Logo</Label>
              <div className="flex items-center gap-3">
                {sponsorForm.logoUrl && (
                  <img src={sponsorForm.logoUrl} alt="logo preview" className="h-14 w-28 object-contain rounded border bg-muted" />
                )}
                <label className="cursor-pointer flex items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Plus className="h-4 w-4" />
                  {sponsorForm.logoUrl ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageUpload('logoUrl', e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">PNG, SVG, JPG — shown in left column of the carousel card</p>
            </div>
            {/* Banner upload */}
            <div className="space-y-2">
              <Label>Sponsor Banner</Label>
              <div className="flex items-center gap-3">
                {sponsorForm.bannerUrl && (
                  <img src={sponsorForm.bannerUrl} alt="banner preview" className="h-14 w-28 object-cover rounded border" />
                )}
                <label className="cursor-pointer flex items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Plus className="h-4 w-4" />
                  {sponsorForm.bannerUrl ? 'Change Banner' : 'Upload Banner'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageUpload('bannerUrl', e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Wide image — shown in right column of the carousel card</p>
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input placeholder="https://..." value={sponsorForm.websiteUrl} onChange={e => setSponsorForm(f => ({ ...f, websiteUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sponsorship Tier</Label>
              <Select value={sponsorForm.tierId} onValueChange={v => setSponsorForm(f => ({ ...f, tierId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sponsorForm.active} onCheckedChange={v => setSponsorForm(f => ({ ...f, active: v }))} />
              <Label>Active (show on public page)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSponsorDialog(false)}>Cancel</Button>
            <Button onClick={saveSponsor} disabled={!sponsorForm.name.trim()}>
              {editingSponsor ? 'Save Changes' : 'Add Sponsor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tier Confirm */}
      <Dialog open={!!deleteTierId} onOpenChange={() => setDeleteTierId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete tier?</DialogTitle>
            <DialogDescription>This will permanently remove this sponsorship tier.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTierId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTierId && handleDeleteTier(deleteTierId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sponsor Confirm */}
      <Dialog open={!!deleteSponsorId} onOpenChange={() => setDeleteSponsorId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove sponsor?</DialogTitle>
            <DialogDescription>This will remove the sponsor from the public page.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSponsorId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteSponsorId && handleDeleteSponsor(deleteSponsorId)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Academic Partner Dialog ---- */}
      <Dialog open={academicDialog} onOpenChange={setAcademicDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAcademic ? 'Edit Academic Partner' : 'Add Academic Partner'}</DialogTitle>
            <DialogDescription>Academic partner details — shown on the home page below the curriculum section</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Institution Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. University of Dar es Salaam" value={academicForm.name} onChange={e => setAcademicForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Short description shown in the partner card..." value={academicForm.description} onChange={e => setAcademicForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Institution Logo</Label>
              <div className="flex items-center gap-3">
                {academicForm.logoUrl && (
                  <img src={academicForm.logoUrl} alt="logo preview" className="h-14 w-28 object-contain rounded border bg-muted" />
                )}
                <label className="cursor-pointer flex items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Plus className="h-4 w-4" />
                  {academicForm.logoUrl ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleAcademicImageUpload('logoUrl', e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">PNG, SVG, JPG — shown in left column of the partner card</p>
            </div>
            {/* Banner upload */}
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="flex items-center gap-3">
                {academicForm.bannerUrl && (
                  <img src={academicForm.bannerUrl} alt="banner preview" className="h-14 w-28 object-cover rounded border" />
                )}
                <label className="cursor-pointer flex items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Plus className="h-4 w-4" />
                  {academicForm.bannerUrl ? 'Change Banner' : 'Upload Banner'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleAcademicImageUpload('bannerUrl', e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Wide image — shown in right column of the partner card</p>
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input placeholder="https://..." value={academicForm.websiteUrl} onChange={e => setAcademicForm(f => ({ ...f, websiteUrl: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={academicForm.active} onCheckedChange={v => setAcademicForm(f => ({ ...f, active: v }))} />
              <Label>Active (show on home page)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcademicDialog(false)}>Cancel</Button>
            <Button onClick={saveAcademic} disabled={!academicForm.name.trim()}>
              {editingAcademic ? 'Save Changes' : 'Add Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Academic Partner Confirm */}
      <Dialog open={!!deleteAcademicId} onOpenChange={() => setDeleteAcademicId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove academic partner?</DialogTitle>
            <DialogDescription>This will remove the academic partner from the home page.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAcademicId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteAcademicId && handleDeleteAcademic(deleteAcademicId)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

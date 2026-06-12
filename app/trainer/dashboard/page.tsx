'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LogOut,
  GraduationCap,
  UploadCloud,
  Users,
  Megaphone,
  ClipboardList,
  User,
  Trash2,
  Plus,
  FileText,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  File,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getCurrentTrainer,
  getTrainerById,
  updateTrainer,
  logoutAll,
  getAllTrainerMaterials,
  createTrainerMaterial,
  updateTrainerMaterial,
  deleteTrainerMaterial,
  getAllTrainerAnnouncements,
  createTrainerAnnouncement,
  deleteTrainerAnnouncement,
  getParticipants,
  getAttendance,
  upsertAttendance,
} from '@/lib/store'
import type { TrainerAccount, Trainer, TrainerMaterial, TrainerAnnouncement, AttendanceRecord, TrainerMaterialType } from '@/lib/types'
import { DEFAULT_SESSIONS } from '@/lib/types'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const FILE_TYPE_ICONS: Record<TrainerMaterialType, React.ElementType> = {
  pdf: FileText,
  video: Video,
  slides: File,
  image: ImageIcon,
  link: LinkIcon,
  other: File,
}

const FILE_TYPE_LABELS: Record<TrainerMaterialType, string> = {
  pdf: 'PDF',
  video: 'Video',
  slides: 'Slides',
  image: 'Image',
  link: 'Link',
  other: 'Other',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TrainerDashboardPage() {
  const router = useRouter()
  const [account, setAccount] = useState<TrainerAccount | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [mounted, setMounted] = useState(false)

  // Materials
  const [materials, setMaterials] = useState<TrainerMaterial[]>([])
  const [matForm, setMatForm] = useState({ title: '', description: '', fileUrl: '', fileName: '', fileType: 'pdf' as TrainerMaterialType, visibleToParticipants: true })
  const [matLoading, setMatLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Announcements
  const [announcements, setAnnouncements] = useState<TrainerAnnouncement[]>([])
  const [annForm, setAnnForm] = useState({ title: '', message: '' })

  // Participants
  const [participants, setParticipants] = useState<ReturnType<typeof getParticipants>>([])

  // Attendance
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [selectedSession, setSelectedSession] = useState(DEFAULT_SESSIONS[0])

  // Profile edit
  const [profileForm, setProfileForm] = useState({ name: '', title: '', bio: '', photoUrl: '', expertise: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const acc = getCurrentTrainer()
    if (!acc) { window.location.href = '/login'; return }
    setAccount(acc)
    const t = getTrainerById(acc.trainerId)
    if (t) {
      setTrainer(t)
      setProfileForm({ name: t.name, title: t.title, bio: t.bio, photoUrl: t.photoUrl, expertise: t.expertise.join(', ') })
    }
    setMaterials(getAllTrainerMaterials(acc.trainerId))
    setAnnouncements(getAllTrainerAnnouncements(acc.trainerId))
    setParticipants(getParticipants())
    setAttendance(getAttendance(acc.trainerId))
  }, [router])

  if (!mounted || !account) return null

  const refreshMaterials = () => setMaterials(getAllTrainerMaterials(account.trainerId))
  const refreshAnnouncements = () => setAnnouncements(getAllTrainerAnnouncements(account.trainerId))
  const refreshAttendance = () => setAttendance(getAttendance(account.trainerId))

  // ---- File upload ----
  const handleFileUpload = (file: File) => {
    setMatLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const typeMap: Record<string, TrainerMaterialType> = { pdf: 'pdf', mp4: 'video', mov: 'video', avi: 'video', ppt: 'slides', pptx: 'slides', key: 'slides', png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image' }
      setMatForm(f => ({ ...f, fileUrl: reader.result as string, fileName: file.name, fileType: typeMap[ext] || 'other' }))
      setMatLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const submitMaterial = () => {
    if (!matForm.title.trim()) return
    createTrainerMaterial({ ...matForm, trainerId: account.trainerId, uploadedAt: new Date().toISOString(), active: true })
    setMatForm({ title: '', description: '', fileUrl: '', fileName: '', fileType: 'pdf', visibleToParticipants: true })
    if (fileInputRef.current) fileInputRef.current.value = ''
    refreshMaterials()
  }

  // ---- Announcement ----
  const submitAnnouncement = () => {
    if (!annForm.title.trim() || !annForm.message.trim()) return
    createTrainerAnnouncement({ ...annForm, trainerId: account.trainerId, postedAt: new Date().toISOString(), active: true })
    setAnnForm({ title: '', message: '' })
    refreshAnnouncements()
  }

  // ---- Attendance ----
  const getRecord = (participantId: string) =>
    attendance.find(r => r.participantId === participantId && r.session === selectedSession)

  const toggleAttendance = (participantId: string, present: boolean) => {
    upsertAttendance(account.trainerId, participantId, selectedSession, new Date().toISOString().split('T')[0], present)
    refreshAttendance()
  }

  // ---- Profile save ----
  const saveProfile = () => {
    if (!trainer) return
    updateTrainer(trainer.id, { name: profileForm.name, title: profileForm.title, bio: profileForm.bio, photoUrl: profileForm.photoUrl, expertise: profileForm.expertise.split(',').map(e => e.trim()).filter(Boolean) })
    const updated = getTrainerById(trainer.id)
    if (updated) setTrainer(updated)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const presentCount = attendance.filter(r => r.session === selectedSession && r.present).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">{trainer?.name || 'Trainer'}</p>
              <p className="text-xs text-muted-foreground">{account.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">View Site</Link>
            <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => { logoutAll(); window.location.href = '/login' }}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {trainer?.name?.split(' ')[0] || 'Trainer'} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your materials, participants, and announcements from here.</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {[
            { label: 'Materials', value: materials.filter(m => m.active).length, icon: UploadCloud },
            { label: 'Announcements', value: announcements.filter(a => a.active).length, icon: Megaphone },
            { label: 'Participants', value: participants.length, icon: Users },
            { label: `Present (${selectedSession.split('–')[0].trim()})`, value: presentCount, icon: ClipboardList },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="materials">
          <TabsList className="flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="materials" className="gap-1.5"><UploadCloud className="h-3.5 w-3.5" /> Materials</TabsTrigger>
            <TabsTrigger value="participants" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Participants</TabsTrigger>
            <TabsTrigger value="announcements" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Announcements</TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Attendance</TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> My Profile</TabsTrigger>
          </TabsList>

          {/* ====== MATERIALS ====== */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Material</CardTitle>
                <CardDescription>Upload PDFs, videos, slides, or images for participants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g. Day 1 Slides" value={matForm.title} onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={matForm.fileType} onValueChange={v => setMatForm(f => ({ ...f, fileType: v as TrainerMaterialType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FILE_TYPE_LABELS) as TrainerMaterialType[]).map(t => (
                          <SelectItem key={t} value={t}>{FILE_TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea rows={2} placeholder="Brief description..." value={matForm.description} onChange={e => setMatForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                {/* File upload or link */}
                {matForm.fileType === 'link' ? (
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input placeholder="https://..." value={matForm.fileUrl} onChange={e => setMatForm(f => ({ ...f, fileUrl: e.target.value, fileName: e.target.value }))} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>File</Label>
                    <label className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors', matForm.fileUrl ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30')}>
                      {matForm.fileUrl ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-primary" />
                          <p className="text-sm font-medium text-foreground">{matForm.fileName}</p>
                          <p className="text-xs text-muted-foreground">Click to replace</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click or drag a file here</p>
                          <p className="text-xs text-muted-foreground/60">PDF, Video, Image, Slides</p>
                        </>
                      )}
                      <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch checked={matForm.visibleToParticipants} onCheckedChange={v => setMatForm(f => ({ ...f, visibleToParticipants: v }))} />
                  <Label>Visible to participants</Label>
                </div>

                <Button onClick={submitMaterial} disabled={!matForm.title.trim() || matLoading || (!matForm.fileUrl)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {matLoading ? 'Processing…' : 'Add Material'}
                </Button>
              </CardContent>
            </Card>

            {/* Materials list */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">{materials.length} material{materials.length !== 1 ? 's' : ''}</h3>
              {materials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <UploadCloud className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No materials yet. Upload your first one above.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {materials.map(mat => {
                    const Icon = FILE_TYPE_ICONS[mat.fileType]
                    return (
                      <Card key={mat.id} className={cn(!mat.active && 'opacity-50')}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{mat.title}</p>
                                <p className="text-xs text-muted-foreground">{FILE_TYPE_LABELS[mat.fileType]} · {formatDate(mat.uploadedAt)}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => { deleteTrainerMaterial(mat.id); refreshMaterials() }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          {mat.description && <p className="text-xs text-muted-foreground line-clamp-2">{mat.description}</p>}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <Switch checked={mat.visibleToParticipants} onCheckedChange={v => { updateTrainerMaterial(mat.id, { visibleToParticipants: v }); refreshMaterials() }} aria-label="Visible to participants" />
                              <span className="text-xs text-muted-foreground">{mat.visibleToParticipants ? 'Visible' : 'Hidden'}</span>
                            </div>
                            {mat.fileUrl && mat.fileType !== 'link' ? (
                              <a href={mat.fileUrl} download={mat.fileName} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                <Download className="h-3 w-3" /> Download
                              </a>
                            ) : mat.fileUrl ? (
                              <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                <LinkIcon className="h-3 w-3" /> Open
                              </a>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ====== PARTICIPANTS ====== */}
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Registered Participants</CardTitle>
                <CardDescription>{participants.length} total registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No participants registered yet.</p>
                ) : (
                  <div className="rounded-lg border divide-y">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <span className="text-sm font-medium text-primary">{p.fullName?.[0] || '?'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email} · {p.city}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs capitalize">{p.selectedPackage?.replace('-', ' ')}</Badge>
                          <Badge className={cn('text-xs', p.paymentStatus === 'paid' ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' : 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30')}>
                            {p.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== ANNOUNCEMENTS ====== */}
          <TabsContent value="announcements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Announcement</CardTitle>
                <CardDescription>Broadcast a message to all participants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. Room change for Day 2" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Message <span className="text-destructive">*</span></Label>
                  <Textarea rows={4} placeholder="Type your announcement here…" value={annForm.message} onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <Button onClick={submitAnnouncement} disabled={!annForm.title.trim() || !annForm.message.trim()} className="gap-2">
                  <Megaphone className="h-4 w-4" /> Post Announcement
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No announcements yet.</p>
                </div>
              ) : (
                announcements.map(ann => (
                  <Card key={ann.id} className={cn(!ann.active && 'opacity-50')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{ann.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ann.postedAt)}</p>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{ann.message}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => { deleteTrainerAnnouncement(ann.id); refreshAnnouncements() }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ====== ATTENDANCE ====== */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Attendance Tracker</CardTitle>
                    <CardDescription>Mark who attended each session</CardDescription>
                  </div>
                  <div className="w-full sm:w-64">
                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEFAULT_SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400 font-medium">{presentCount} present</span>
                  <span>·</span>
                  <span className="text-red-500 font-medium">{participants.length - presentCount} absent</span>
                  <span>·</span>
                  <span>{participants.length} total</span>
                </div>
                {participants.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No participants to mark.</p>
                ) : (
                  <div className="rounded-lg border divide-y">
                    {participants.map(p => {
                      const record = getRecord(p.id)
                      const isPresent = record?.present ?? false
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {isPresent
                              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                              : <XCircle className="h-4 w-4 text-muted-foreground/40" />
                            }
                            <Switch
                              checked={isPresent}
                              onCheckedChange={v => toggleAttendance(p.id, v)}
                              aria-label={`Mark ${p.fullName} ${isPresent ? 'absent' : 'present'}`}
                            />
                            <span className={cn('text-xs w-12', isPresent ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground')}>
                              {isPresent ? 'Present' : 'Absent'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== PROFILE ====== */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Update your public bio, photo, and expertise shown to participants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Photo */}
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    {profileForm.photoUrl ? (
                      <img src={profileForm.photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-dashed text-2xl font-bold text-primary">
                        {profileForm.name?.[0] || '?'}
                      </div>
                    )}
                    <label className="cursor-pointer flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <UploadCloud className="h-4 w-4" /> Upload Photo
                      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => setProfileForm(f => ({ ...f, photoUrl: reader.result as string }))
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Title / Role</Label>
                    <Input placeholder="e.g. AI & Automation Expert" value={profileForm.title} onChange={e => setProfileForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea rows={4} value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Expertise (comma-separated)</Label>
                  <Input placeholder="e.g. AI Tools, Social Media, Automation" value={profileForm.expertise} onChange={e => setProfileForm(f => ({ ...f, expertise: e.target.value }))} />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={saveProfile} className="gap-2">
                    <Save className="h-4 w-4" /> Save Profile
                  </Button>
                  {profileSaved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved!</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

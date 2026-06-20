'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Settings,
  Image as ImageIcon,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Star,
  Package as PackageIcon,
  CreditCard,
  Armchair,
  Save,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  KeyRound,
  Users,
  X,
  Download,
  Copy,
  Share2,
  Upload,
} from 'lucide-react'
import {
  getSiteSettings,
  updateSiteSettings,
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getAllCurriculum,
  createCurriculumModule,
  updateCurriculumModule,
  deleteCurriculumModule,
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAllChatbotQA,
  createChatbotQA,
  updateChatbotQA,
  deleteChatbotQA,
  getAllPackages,
  updatePackage,
  getAllPaymentMethods,
  updatePaymentMethod,
  getSeatConfiguration,
  updatePackageSeats,
  resetAllData,
  getAdminCredential,
  updateAdminCredential,
  updateAdminEmail,
  createPackage,
  deletePackage,
  getGroupPricingTiers,
  updateGroupPricingTiers,
} from '@/lib/store'
import { useStoreReady } from '@/components/store-provider'
import type {
  SiteSettings,
  HeroSlide,
  CurriculumModule,
  FAQ,
  Testimonial,
  ChatbotQA,
  Package,
  PaymentMethodConfig,
  PackageType,
  GroupPricingTier,
} from '@/lib/types'

export default function AdminSettingsPage() {
  const storeReady = useStoreReady()
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingSeats, setIsSavingSeats] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  
  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isSlideDialogOpen, setIsSlideDialogOpen] = useState(false)
  
  // Curriculum
  const [curriculum, setCurriculum] = useState<CurriculumModule[]>([])
  const [editingModule, setEditingModule] = useState<CurriculumModule | null>(null)
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  
  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false)
  
  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false)
  
  // Chatbot QA
  const [chatbotQA, setChatbotQA] = useState<ChatbotQA[]>([])
  const [editingQA, setEditingQA] = useState<ChatbotQA | null>(null)
  const [isQADialogOpen, setIsQADialogOpen] = useState(false)
  
  // Packages
  const [packages, setPackages] = useState<Package[]>([])
  
  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([])
  
  // Seat Configuration
  const [packageSeats, setPackageSeats] = useState<Record<string, number>>({})
  const [seatConfig, setSeatConfig] = useState({ confirmedSeats: 0, reservedSeats: 0, waitlistCount: 0 })

  // Group Pricing Tiers
  const [groupTiers, setGroupTiers] = useState<GroupPricingTier[]>([])
  const [groupTierSaved, setGroupTierSaved] = useState(false)

  // New Package Dialog
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false)
  const [newPkg, setNewPkg] = useState({ name: '', description: '', price: '', currency: 'TZS', features: '', popular: false })
  
  // Admin Account
  const [adminEmail, setAdminEmail] = useState('')
  const [adminNewPassword, setAdminNewPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [adminCredMessage, setAdminCredMessage] = useState('')
  const [adminCredError, setAdminCredError] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null)

  // Reset confirmation
  const [resetConfirm, setResetConfirm] = useState(false)

  useEffect(() => {
    setSiteSettings(getSiteSettings())
    setHeroSlides(getHeroSlides())
    setCurriculum(getAllCurriculum())
    setFaqs(getAllFAQs())
    setTestimonials(getAllTestimonials())
    setChatbotQA(getAllChatbotQA())
    setPackages(getAllPackages())
    setPaymentMethods(getAllPaymentMethods())
    const seatCfg = getSeatConfiguration()
    setPackageSeats(seatCfg.packageSeats)
    setSeatConfig({ confirmedSeats: seatCfg.confirmedSeats, reservedSeats: seatCfg.reservedSeats, waitlistCount: seatCfg.waitlistCount })
    setGroupTiers(getGroupPricingTiers())
    setAdminEmail(getAdminCredential().email)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  const handleSaveSettings = () => {
    if (!siteSettings) return
    setIsSaving(true)
    updateSiteSettings(siteSettings)
    setTimeout(() => {
      setIsSaving(false)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    }, 500)
  }

  const handleSaveSeats = () => {
    setIsSavingSeats(true)
    updatePackageSeats(packageSeats)
    setTimeout(() => {
      setIsSavingSeats(false)
      setSaveMessage('Seat configuration updated!')
      setTimeout(() => setSaveMessage(''), 3000)
    }, 500)
  }

  const handleResetData = () => {
    resetAllData()
    window.location.reload()
  }

  // Hero Slide handlers
  const handleSaveSlide = (slide: Partial<HeroSlide>) => {
    if (editingSlide?.id) {
      updateHeroSlide(editingSlide.id, slide)
    } else {
      createHeroSlide(slide as Omit<HeroSlide, 'id'>)
    }
    setHeroSlides(getHeroSlides())
    setIsSlideDialogOpen(false)
    setEditingSlide(null)
  }

  // Curriculum handlers
  const handleSaveModule = (module: Partial<CurriculumModule>) => {
    if (editingModule?.id) {
      updateCurriculumModule(editingModule.id, module)
    } else {
      createCurriculumModule(module as Omit<CurriculumModule, 'id'>)
    }
    setCurriculum(getAllCurriculum())
    setIsModuleDialogOpen(false)
    setEditingModule(null)
  }

  // FAQ handlers
  const handleSaveFaq = (faq: Partial<FAQ>) => {
    if (editingFaq?.id) {
      updateFAQ(editingFaq.id, faq)
    } else {
      createFAQ(faq as Omit<FAQ, 'id'>)
    }
    setFaqs(getAllFAQs())
    setIsFaqDialogOpen(false)
    setEditingFaq(null)
  }

  // Testimonial handlers
  const handleSaveTestimonial = (testimonial: Partial<Testimonial>) => {
    if (editingTestimonial?.id) {
      updateTestimonial(editingTestimonial.id, testimonial)
    } else {
      createTestimonial(testimonial as Omit<Testimonial, 'id'>)
    }
    setTestimonials(getAllTestimonials())
    setIsTestimonialDialogOpen(false)
    setEditingTestimonial(null)
  }

  // Chatbot QA handlers
  const handleSaveQA = (qa: Partial<ChatbotQA>) => {
    if (editingQA?.id) {
      updateChatbotQA(editingQA.id, qa)
    } else {
      createChatbotQA(qa as Omit<ChatbotQA, 'id'>)
    }
    setChatbotQA(getAllChatbotQA())
    setIsQADialogOpen(false)
    setEditingQA(null)
  }

  // Delete handlers
  const handleDelete = () => {
    if (!deleteConfirm) return
    
    switch (deleteConfirm.type) {
      case 'slide':
        deleteHeroSlide(deleteConfirm.id)
        setHeroSlides(getHeroSlides())
        break
      case 'module':
        deleteCurriculumModule(deleteConfirm.id)
        setCurriculum(getAllCurriculum())
        break
      case 'faq':
        deleteFAQ(deleteConfirm.id)
        setFaqs(getAllFAQs())
        break
      case 'testimonial':
        deleteTestimonial(deleteConfirm.id)
        setTestimonials(getAllTestimonials())
        break
      case 'qa':
        deleteChatbotQA(deleteConfirm.id)
        setChatbotQA(getAllChatbotQA())
        break
      case 'package': {
        deletePackage(deleteConfirm.id)
        setPackages(getAllPackages())
        const cfgAfterDelete = getSeatConfiguration()
        setPackageSeats(cfgAfterDelete.packageSeats)
        setSeatConfig({ confirmedSeats: cfgAfterDelete.confirmedSeats, reservedSeats: cfgAfterDelete.reservedSeats, waitlistCount: cfgAfterDelete.waitlistCount })
        break
      }
    }
    setDeleteConfirm(null)
  }

  // Package handlers
  const handleUpdatePackage = (id: PackageType, data: Partial<Package>) => {
    updatePackage(id, data)
    setPackages(getAllPackages())
  }

  const handleAddPackage = () => {
    if (!newPkg.name.trim() || !newPkg.price) return
    createPackage({
      name: newPkg.name.trim(),
      description: newPkg.description.trim() || undefined,
      price: parseInt(newPkg.price) || 0,
      currency: newPkg.currency.trim() || 'TZS',
      features: newPkg.features.split('\n').filter(f => f.trim()),
      popular: newPkg.popular,
      active: true,
    })
    const refreshed = getAllPackages()
    setPackages(refreshed)
    const cfgAfterAdd = getSeatConfiguration()
    setPackageSeats(cfgAfterAdd.packageSeats)
    setSeatConfig({ confirmedSeats: cfgAfterAdd.confirmedSeats, reservedSeats: cfgAfterAdd.reservedSeats, waitlistCount: cfgAfterAdd.waitlistCount })
    setNewPkg({ name: '', description: '', price: '', currency: 'TZS', features: '', popular: false })
    setIsAddPackageOpen(false)
  }

  // Payment method update handler
  const handleUpdatePaymentMethod = (id: string, data: Partial<PaymentMethodConfig>) => {
    updatePaymentMethod(id, data)
    setPaymentMethods(getAllPaymentMethods())
  }

  // Admin credential handler
  const handleSaveAdminCredential = () => {
    setAdminCredMessage('')
    setAdminCredError('')
    const trimmedEmail = adminEmail.trim()
    if (!trimmedEmail) {
      setAdminCredError('Email cannot be empty.')
      return
    }
    if (adminNewPassword || adminConfirmPassword) {
      if (adminNewPassword.length < 6) {
        setAdminCredError('New password must be at least 6 characters.')
        return
      }
      if (adminNewPassword !== adminConfirmPassword) {
        setAdminCredError('Passwords do not match.')
        return
      }
      updateAdminCredential(trimmedEmail, adminNewPassword)
      setAdminNewPassword('')
      setAdminConfirmPassword('')
    } else {
      updateAdminEmail(trimmedEmail)
    }
    setAdminCredMessage('Admin credentials updated successfully!')
    setTimeout(() => setAdminCredMessage(''), 3000)
  }

  if (!siteSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground">
              Manage all configurable content and settings for your registration system
            </p>
          </div>
          {saveMessage && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              {saveMessage}
            </Badge>
          )}
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11 gap-1 h-auto p-1">
            <TabsTrigger value="general" className="flex items-center gap-1 text-xs">
              <Settings className="h-3 w-3" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="hero" className="flex items-center gap-1 text-xs">
              <ImageIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Hero</span>
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="flex items-center gap-1 text-xs">
              <BookOpen className="h-3 w-3" />
              <span className="hidden sm:inline">Curriculum</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-1 text-xs">
              <HelpCircle className="h-3 w-3" />
              <span className="hidden sm:inline">FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Chatbot</span>
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-1 text-xs">
              <PackageIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1 text-xs">
              <CreditCard className="h-3 w-3" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="seats" className="flex items-center gap-1 text-xs">
              <Armchair className="h-3 w-3" />
              <span className="hidden sm:inline">Seats</span>
            </TabsTrigger>
            <TabsTrigger value="group-pricing" className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Group</span>
            </TabsTrigger>
            <TabsTrigger value="admin-account" className="flex items-center gap-1 text-xs">
              <KeyRound className="h-3 w-3" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Configure the main event information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input
                      id="eventName"
                      value={siteSettings.eventName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, eventName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventTagline">Tagline</Label>
                    <Input
                      id="eventTagline"
                      value={siteSettings.eventTagline}
                      onChange={(e) => setSiteSettings({ ...siteSettings, eventTagline: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Description</Label>
                  <Textarea
                    id="eventDescription"
                    rows={3}
                    value={siteSettings.eventDescription}
                    onChange={(e) => setSiteSettings({ ...siteSettings, eventDescription: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Start Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={siteSettings.eventDate}
                      onChange={(e) => setSiteSettings({ ...siteSettings, eventDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventEndDate">End Date</Label>
                    <Input
                      id="eventEndDate"
                      type="date"
                      value={siteSettings.eventEndDate}
                      onChange={(e) => setSiteSettings({ ...siteSettings, eventEndDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventTime">Time</Label>
                    <Input
                      id="eventTime"
                      value={siteSettings.eventTime}
                      onChange={(e) => setSiteSettings({ ...siteSettings, eventTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="eventVenue">Venue</Label>
                    <Input
                      id="eventVenue"
                      value={siteSettings.eventVenue}
                      onChange={(e) => setSiteSettings({ ...siteSettings, eventVenue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventCity">City</Label>
                    <Input
                      id="eventCity"
                      value={siteSettings.eventCity}
                      onChange={(e) => setSiteSettings({ ...siteSettings, eventCity: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Configure contact details shown to users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={siteSettings.contactEmail}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      value={siteSettings.contactPhone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactWhatsApp">WhatsApp Number</Label>
                    <Input
                      id="contactWhatsApp"
                      value={siteSettings.contactWhatsApp}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactWhatsApp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officeHours">Office Hours</Label>
                    <Input
                      id="officeHours"
                      value={siteSettings.officeHours}
                      onChange={(e) => setSiteSettings({ ...siteSettings, officeHours: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registration Settings</CardTitle>
                <CardDescription>Configure registration behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Registration Open</Label>
                    <p className="text-sm text-muted-foreground">Allow new registrations</p>
                  </div>
                  <Switch
                    checked={siteSettings.registrationOpen}
                    onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, registrationOpen: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Waitlist Enabled</Label>
                    <p className="text-sm text-muted-foreground">Allow waitlist when seats are full</p>
                  </div>
                  <Switch
                    checked={siteSettings.waitlistEnabled}
                    onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, waitlistEnabled: checked })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minGroupSize">Min Group Size</Label>
                    <Input
                      id="minGroupSize"
                      type="number"
                      min={2}
                      value={siteSettings.minGroupSize}
                      onChange={(e) => setSiteSettings({ ...siteSettings, minGroupSize: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxGroupSize">Max Group Size</Label>
                    <Input
                      id="maxGroupSize"
                      type="number"
                      max={50}
                      value={siteSettings.maxGroupSize}
                      onChange={(e) => setSiteSettings({ ...siteSettings, maxGroupSize: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>Registration QR Code</CardTitle>
                <CardDescription>Share this QR code so participants can scan and register directly</CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationQRCode />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </TabsContent>

          {/* Hero Slides Tab */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Hero Slides</CardTitle>
                  <CardDescription>Manage the homepage slideshow images and content</CardDescription>
                </div>
                <Button onClick={() => { setEditingSlide(null); setIsSlideDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slide
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Subtitle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heroSlides.map((slide) => (
                      <TableRow key={slide.id}>
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">{slide.title}</TableCell>
                        <TableCell>{slide.subtitle}</TableCell>
                        <TableCell>
                          <Badge variant={slide.active ? 'default' : 'secondary'}>
                            {slide.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingSlide(slide); setIsSlideDialogOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm({ type: 'slide', id: slide.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Curriculum Modules</CardTitle>
                  <CardDescription>Manage the training curriculum and modules</CardDescription>
                </div>
                <Button onClick={() => { setEditingModule(null); setIsModuleDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Topics</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {curriculum.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.title}</TableCell>
                        <TableCell>Day {module.day}</TableCell>
                        <TableCell>{module.duration}</TableCell>
                        <TableCell>{module.topics.length} topics</TableCell>
                        <TableCell>
                          <Badge variant={module.active ? 'default' : 'secondary'}>
                            {module.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingModule(module); setIsModuleDialogOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm({ type: 'module', id: module.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Manage FAQs displayed on the website</CardDescription>
                </div>
                <Button onClick={() => { setEditingFaq(null); setIsFaqDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add FAQ
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="font-medium max-w-md truncate">{faq.question}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{faq.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={faq.active ? 'default' : 'secondary'}>
                            {faq.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingFaq(faq); setIsFaqDialogOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm({ type: 'faq', id: faq.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Testimonials</CardTitle>
                  <CardDescription>Manage customer reviews and testimonials</CardDescription>
                </div>
                <Button onClick={() => { setEditingTestimonial(null); setIsTestimonialDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Testimonial
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{testimonial.name}</h4>
                            <p className="text-sm text-muted-foreground">{testimonial.title} at {testimonial.company}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{testimonial.content}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-2">
                            <Badge variant={testimonial.active ? 'default' : 'secondary'}>
                              {testimonial.active ? 'Active' : 'Inactive'}
                            </Badge>
                            {testimonial.featured && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingTestimonial(testimonial); setIsTestimonialDialogOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm({ type: 'testimonial', id: testimonial.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chatbot Q&A</CardTitle>
                  <CardDescription>Configure automated chatbot responses</CardDescription>
                </div>
                <Button onClick={() => { setEditingQA(null); setIsQADialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Q&A
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatbotQA.map((qa) => (
                      <TableRow key={qa.id}>
                        <TableCell className="font-medium max-w-xs truncate">{qa.question}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {qa.keywords.slice(0, 3).map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                            ))}
                            {qa.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{qa.keywords.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{qa.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={qa.active ? 'default' : 'secondary'}>
                            {qa.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingQA(qa); setIsQADialogOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm({ type: 'qa', id: qa.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pricing Packages</CardTitle>
                    <CardDescription>Edit all package details — name, description, pricing, features, and visibility</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddPackageOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Package
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 md:grid-cols-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className={`rounded-xl border-2 p-5 space-y-4 ${pkg.popular ? 'border-primary' : 'border-border'}`}>
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={pkg.active ? 'default' : 'secondary'}>
                          {pkg.active ? 'Active' : 'Hidden'}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteConfirm({ type: 'package', id: pkg.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Popular</span>
                            <Switch
                              checked={!!pkg.popular}
                              onCheckedChange={(checked) => handleUpdatePackage(pkg.id, { popular: checked })}
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Active</span>
                            <Switch
                              checked={pkg.active}
                              onCheckedChange={(checked) => handleUpdatePackage(pkg.id, { active: checked })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Package Name</Label>
                        <Input
                          value={pkg.name}
                          onChange={(e) => handleUpdatePackage(pkg.id, { name: e.target.value })}
                          placeholder="Package name"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
                        <Textarea
                          rows={2}
                          value={pkg.description ?? ''}
                          onChange={(e) => handleUpdatePackage(pkg.id, { description: e.target.value })}
                          placeholder="Short description shown to participants"
                        />
                      </div>

                      {/* Currency */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Currency</Label>
                        <Input
                          value={pkg.currency}
                          onChange={(e) => handleUpdatePackage(pkg.id, { currency: e.target.value })}
                          placeholder="TZS"
                        />
                      </div>

                      {/* Price */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</Label>
                        <Input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => handleUpdatePackage(pkg.id, { price: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      {/* Original Price */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original Price (strikethrough)</Label>
                          <Switch
                            checked={pkg.originalPrice !== undefined && pkg.originalPrice > 0}
                            onCheckedChange={(checked) =>
                              handleUpdatePackage(pkg.id, { originalPrice: checked ? (pkg.price + 100000) : undefined })
                            }
                          />
                        </div>
                        {pkg.originalPrice !== undefined && pkg.originalPrice > 0 && (
                          <Input
                            type="number"
                            value={pkg.originalPrice}
                            onChange={(e) => handleUpdatePackage(pkg.id, { originalPrice: parseInt(e.target.value) || 0 })}
                          />
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features (one per line)</Label>
                        <Textarea
                          rows={6}
                          value={pkg.features.join('\n')}
                          onChange={(e) => handleUpdatePackage(pkg.id, { features: e.target.value.split('\n') })}
                          onBlur={(e) => handleUpdatePackage(pkg.id, { features: e.target.value.split('\n').filter(f => f.trim()) })}
                          placeholder="Each line becomes a feature bullet"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Enable or disable payment options</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Processing Time</TableHead>
                      <TableHead>Account Info</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell className="font-medium">{method.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{method.type}</Badge>
                        </TableCell>
                        <TableCell>{method.processingTime}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {method.accountInfo || '-'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={method.active}
                            onCheckedChange={(checked) => handleUpdatePaymentMethod(method.id, { active: checked })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seats Tab */}
          <TabsContent value="seats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seat Configuration per Package</CardTitle>
                <CardDescription>
                  Set how many seats are allocated to each plan. Packages are laid out front-to-back in the order shown below.
                  New packages added in the Packages tab appear here automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(() => {
                  // seat zone colors that rotate for any number of packages
                  const ZONE_STYLES = [
                    { border: 'border-purple-200 dark:border-purple-800/50', bg: 'bg-purple-50/40 dark:bg-purple-950/20', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', inputBorder: 'border-purple-300 dark:border-purple-700 focus-visible:ring-purple-400' },
                    { border: 'border-blue-200 dark:border-blue-800/50',   bg: 'bg-blue-50/40 dark:bg-blue-950/20',   dot: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-300',   inputBorder: 'border-blue-300 dark:border-blue-700 focus-visible:ring-blue-400' },
                    { border: 'border-amber-200 dark:border-amber-800/50', bg: 'bg-amber-50/40 dark:bg-amber-950/20', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', inputBorder: 'border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400' },
                    { border: 'border-green-200 dark:border-green-800/50', bg: 'bg-green-50/40 dark:bg-green-950/20', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-300', inputBorder: 'border-green-300 dark:border-green-700 focus-visible:ring-green-400' },
                    { border: 'border-rose-200 dark:border-rose-800/50',   bg: 'bg-rose-50/40 dark:bg-rose-950/20',   dot: 'bg-rose-500',   text: 'text-rose-700 dark:text-rose-300',   inputBorder: 'border-rose-300 dark:border-rose-700 focus-visible:ring-rose-400' },
                    { border: 'border-cyan-200 dark:border-cyan-800/50',   bg: 'bg-cyan-50/40 dark:bg-cyan-950/20',   dot: 'bg-cyan-500',   text: 'text-cyan-700 dark:text-cyan-300',   inputBorder: 'border-cyan-300 dark:border-cyan-700 focus-visible:ring-cyan-400' },
                  ]

                  // ordered package IDs — same order getSeatRangeForPackage uses (insertion order)
                  const pkgIds = Object.keys(packageSeats)
                  let cumulative = 0

                  return (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {pkgIds.map((id, idx) => {
                        const count = packageSeats[id] ?? 0
                        const start = cumulative + 1
                        const end = cumulative + count
                        cumulative += count
                        const s = ZONE_STYLES[idx % ZONE_STYLES.length]
                        const pkg = packages.find(p => p.id === id)
                        const isFirst = idx === 0
                        const isLast = idx === pkgIds.length - 1
                        return (
                          <div key={id} className={`rounded-xl border-2 ${s.border} ${s.bg} p-4 space-y-3`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className={`h-3 w-3 rounded-full shrink-0 ${s.dot}`} />
                              <span className={`font-semibold text-sm ${s.text}`}>
                                {pkg?.name ?? id} Zone
                              </span>
                              {isFirst && (
                                <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${s.text} bg-white/60 dark:bg-white/10`}>Front</span>
                              )}
                              {isLast && (
                                <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${s.text} bg-white/60 dark:bg-white/10`}>Back</span>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`seats-${id}`} className={s.text}>Number of Seats</Label>
                              <Input
                                id={`seats-${id}`}
                                type="number"
                                min={0}
                                max={500}
                                value={count}
                                onChange={(e) => setPackageSeats(prev => ({ ...prev, [id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                className={s.inputBorder}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {count > 0 ? `Seats ${start} – ${end}` : 'No seats allocated'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Summary row */}
                <div className="rounded-lg bg-muted/50 border p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Total Venue Capacity</p>
                    <p className="text-2xl font-bold text-primary">
                      {Object.values(packageSeats).reduce((sum, n) => sum + n, 0)} seats
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div>
                      <p>Confirmed</p>
                      <p className="font-bold text-foreground">{seatConfig.confirmedSeats}</p>
                    </div>
                    <div>
                      <p>Pending</p>
                      <p className="font-bold text-foreground">{seatConfig.reservedSeats}</p>
                    </div>
                    <div>
                      <p>Waitlist</p>
                      <p className="font-bold text-foreground">{seatConfig.waitlistCount}</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSeats} disabled={isSavingSeats}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingSeats ? 'Saving...' : 'Save Seat Configuration'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions that affect all data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setResetConfirm(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  This will delete all participants, settings, and content. This action cannot be undone.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Pricing Tab */}
          <TabsContent value="group-pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Group Discount Tiers
                    </CardTitle>
                    <CardDescription>
                      Set the discount percentage, per-seat price, and bonuses for each group size tier
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const last = groupTiers[groupTiers.length - 1]
                      const newMin = last ? last.maxSeats + 1 : 2
                      setGroupTiers(prev => [...prev, {
                        minSeats: newMin,
                        maxSeats: newMin + 1,
                        discountPercent: 10,
                        perSeatPrice: 350000,
                        bonuses: ['Priority Seating'],
                      }])
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tier
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupTierSaved && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                    Group pricing saved successfully.
                  </div>
                )}

                {groupTiers.map((tier, i) => (
                  <div key={i} className="rounded-xl border border-border bg-secondary/20 p-5 space-y-4">
                    {/* Tier header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Tier {i + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setGroupTiers(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Seat range + discount + price */}
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min Seats</Label>
                        <Input
                          type="number"
                          min={1}
                          value={tier.minSeats}
                          onChange={(e) => setGroupTiers(prev => prev.map((t, idx) =>
                            idx === i ? { ...t, minSeats: parseInt(e.target.value) || 1 } : t
                          ))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max Seats</Label>
                        <Input
                          type="number"
                          min={tier.minSeats}
                          value={tier.maxSeats}
                          onChange={(e) => setGroupTiers(prev => prev.map((t, idx) =>
                            idx === i ? { ...t, maxSeats: parseInt(e.target.value) || tier.minSeats } : t
                          ))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discount %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={tier.discountPercent}
                          onChange={(e) => setGroupTiers(prev => prev.map((t, idx) =>
                            idx === i ? { ...t, discountPercent: parseInt(e.target.value) || 0 } : t
                          ))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price per Seat (TZS)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={tier.perSeatPrice}
                          onChange={(e) => setGroupTiers(prev => prev.map((t, idx) =>
                            idx === i ? { ...t, perSeatPrice: parseInt(e.target.value) || 0 } : t
                          ))}
                        />
                      </div>
                    </div>

                    {/* Bonuses */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bonuses (one per line)</Label>
                        <span className="text-xs text-muted-foreground">{tier.bonuses.length} bonus{tier.bonuses.length !== 1 ? 'es' : ''}</span>
                      </div>
                      <Textarea
                        rows={3}
                        value={tier.bonuses.join('\n')}
                        onChange={(e) => setGroupTiers(prev => prev.map((t, idx) =>
                          idx === i ? { ...t, bonuses: e.target.value.split('\n') } : t
                        ))}
                        placeholder="Priority Seating&#10;Team Networking Session&#10;Group Photo Session"
                      />
                    </div>

                    {/* Preview badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Preview:</span>
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                        {tier.discountPercent}% OFF
                      </span>
                      <span className="text-xs text-foreground font-medium">
                        {tier.minSeats === tier.maxSeats ? `${tier.minSeats} seats` : `${tier.minSeats}–${tier.maxSeats} seats`}
                      </span>
                      <span className="text-xs text-primary font-semibold">
                        TZS {new Intl.NumberFormat('en-TZ').format(tier.perSeatPrice)}/seat
                      </span>
                    </div>
                  </div>
                ))}

                {groupTiers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No group pricing tiers</p>
                    <p className="text-xs mt-1">Click "Add Tier" to create your first group discount.</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      updateGroupPricingTiers(groupTiers.map(t => ({ ...t, bonuses: t.bonuses.filter(b => b.trim()) })))
                      setGroupTierSaved(true)
                      setTimeout(() => setGroupTierSaved(false), 3000)
                    }}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Group Pricing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Account Tab */}
          <TabsContent value="admin-account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login Credentials</CardTitle>
                <CardDescription>
                  Change the email and password used to log in as administrator.
                  Leave password fields blank to update only the email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Change Password</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdminPassword((v) => !v)}
                      className="h-7 gap-1 text-xs text-muted-foreground"
                    >
                      {showAdminPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showAdminPassword ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="adminNewPassword">New Password</Label>
                      <Input
                        id="adminNewPassword"
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminConfirmPassword">Confirm New Password</Label>
                      <Input
                        id="adminConfirmPassword"
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>
                </div>

                {adminCredError && (
                  <p className="text-sm font-medium text-destructive">{adminCredError}</p>
                )}
                {adminCredMessage && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{adminCredMessage}</p>
                )}

                <Button onClick={handleSaveAdminCredential}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Credentials
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Default Credentials</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Default email: <span className="font-mono text-foreground">admin@masterclass.co.tz</span></p>
                <p>Default password: <span className="font-mono text-foreground">admin123</span></p>
                <p className="text-xs pt-1">These are the factory defaults. If you have changed them above, use your new credentials.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hero Slide Dialog */}
      <SlideDialog
        open={isSlideDialogOpen}
        onOpenChange={setIsSlideDialogOpen}
        slide={editingSlide}
        onSave={handleSaveSlide}
      />

      {/* Module Dialog */}
      <ModuleDialog
        open={isModuleDialogOpen}
        onOpenChange={setIsModuleDialogOpen}
        module={editingModule}
        onSave={handleSaveModule}
      />

      {/* FAQ Dialog */}
      <FAQDialog
        open={isFaqDialogOpen}
        onOpenChange={setIsFaqDialogOpen}
        faq={editingFaq}
        onSave={handleSaveFaq}
      />

      {/* Testimonial Dialog */}
      <TestimonialDialog
        open={isTestimonialDialogOpen}
        onOpenChange={setIsTestimonialDialogOpen}
        testimonial={editingTestimonial}
        onSave={handleSaveTestimonial}
      />

      {/* Chatbot QA Dialog */}
      <QADialog
        open={isQADialogOpen}
        onOpenChange={setIsQADialogOpen}
        qa={editingQA}
        onSave={handleSaveQA}
      />

      {/* Add Package Dialog */}
      <Dialog open={isAddPackageOpen} onOpenChange={setIsAddPackageOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>Add New Package</DialogTitle>
            <DialogDescription>Create a new pricing package. It will appear in the registration form and pricing page immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label htmlFor="np-name">Package Name *</Label>
              <Input id="np-name" value={newPkg.name} onChange={e => setNewPkg(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Plus" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-desc">Description</Label>
              <Textarea id="np-desc" rows={2} value={newPkg.description} onChange={e => setNewPkg(p => ({ ...p, description: e.target.value }))} placeholder="Short description for participants" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="np-price">Price *</Label>
                <Input id="np-price" type="number" value={newPkg.price} onChange={e => setNewPkg(p => ({ ...p, price: e.target.value }))} placeholder="500000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="np-currency">Currency</Label>
                <Input id="np-currency" value={newPkg.currency} onChange={e => setNewPkg(p => ({ ...p, currency: e.target.value }))} placeholder="TZS" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-features">Features (one per line)</Label>
              <Textarea id="np-features" rows={4} value={newPkg.features} onChange={e => setNewPkg(p => ({ ...p, features: e.target.value }))} placeholder={'Full Access\nCertificate\nNetworking'} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newPkg.popular} onCheckedChange={v => setNewPkg(p => ({ ...p, popular: v }))} id="np-popular" />
              <Label htmlFor="np-popular">Mark as Most Popular</Label>
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setIsAddPackageOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPackage} disabled={!newPkg.name.trim() || !newPkg.price}>
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL data including participants, settings, content, and configurations. 
              The system will be reset to default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground">
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}

// ── Registration QR Code ─────────────────────────────────────────────────────
function RegistrationQRCode() {
  const [url, setUrl] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUrl(window.location.origin)
  }, [])

  const registrationUrl = `${url}/#register`

  const downloadQR = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'registration-qr.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(registrationUrl)
  }, [registrationUrl])

  const shareLink = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Register Now', url: registrationUrl })
    } else {
      navigator.clipboard.writeText(registrationUrl)
    }
  }, [registrationUrl])

  if (!url) return null

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div ref={qrRef} className="rounded-xl border border-border bg-white p-4 shrink-0">
        <QRCodeCanvas
          value={registrationUrl}
          size={180}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin={false}
        />
      </div>
      <div className="space-y-3 flex-1">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Registration Link</p>
          <p className="text-xs font-mono text-muted-foreground break-all bg-muted/50 rounded px-2 py-1">{registrationUrl}</p>
        </div>
        <p className="text-xs text-muted-foreground">Participants scan this QR code to go directly to the registration page. Download it to use on flyers and posters.</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={downloadQR} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download PNG
          </Button>
          <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </Button>
          <Button size="sm" variant="outline" onClick={shareLink} className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        </div>
      </div>
    </div>
  )
}

// Dialog Components
function SlideDialog({ open, onOpenChange, slide, onSave }: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  slide: HeroSlide | null
  onSave: (slide: Partial<HeroSlide>) => void 
}) {
  const [form, setForm] = useState<Partial<HeroSlide>>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    ctaText: 'Register Now',
    ctaLink: '#register',
    order: 1,
    active: true,
  })

  useEffect(() => {
    if (slide) {
      setForm(slide)
    } else {
      setForm({
        title: '',
        subtitle: '',
        description: '',
        imageUrl: '',
        ctaText: 'Register Now',
        ctaLink: '#register',
        order: 1,
        active: true,
      })
    }
  }, [slide])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{slide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
          <DialogDescription>Configure the hero slideshow content</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Hero Image</Label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 p-4 text-center transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload image from your computer</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setForm({ ...form, imageUrl: reader.result as string })
                  reader.readAsDataURL(file)
                }}
              />
            </label>
            {form.imageUrl && form.imageUrl.startsWith('data:') && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="Preview" className="h-24 w-full rounded-lg object-cover border border-border" />
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or use URL</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Input value={form.imageUrl?.startsWith('data:') ? '' : (form.imageUrl || '')} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/hero-1.jpg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA Text</Label>
              <Input value={form.ctaText || ''} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CTA Link</Label>
              <Input value={form.ctaLink || ''} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order || 1} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
              <Label>Active</Label>
            </div>
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ModuleDialog({ open, onOpenChange, module, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  module: CurriculumModule | null
  onSave: (module: Partial<CurriculumModule>) => void
}) {
  const [form, setForm] = useState<Partial<CurriculumModule>>({
    title: '',
    description: '',
    icon: 'book-open',
    topics: [],
    outcomes: [],
    duration: '4 hours',
    day: 1,
    order: 1,
    active: true,
  })

  useEffect(() => {
    if (module) {
      setForm(module)
    } else {
      setForm({
        title: '',
        description: '',
        icon: 'book-open',
        topics: [],
        outcomes: [],
        duration: '4 hours',
        day: 1,
        order: 1,
        active: true,
      })
    }
  }, [module])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{module ? 'Edit Module' : 'Add New Module'}</DialogTitle>
          <DialogDescription>Configure curriculum module details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Input type="number" min={1} max={5} value={form.day || 1} onChange={(e) => setForm({ ...form, day: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input value={form.duration || ''} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order || 1} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Topics (one per line)</Label>
            <Textarea rows={4} value={(form.topics || []).join('\n')} onChange={(e) => setForm({ ...form, topics: e.target.value.split('\n').filter(Boolean) })} />
          </div>
          <div className="space-y-2">
            <Label>Learning Outcomes (one per line)</Label>
            <Textarea rows={3} value={(form.outcomes || []).join('\n')} onChange={(e) => setForm({ ...form, outcomes: e.target.value.split('\n').filter(Boolean) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FAQDialog({ open, onOpenChange, faq, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  faq: FAQ | null
  onSave: (faq: Partial<FAQ>) => void
}) {
  const [form, setForm] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    category: 'general',
    order: 1,
    active: true,
  })

  useEffect(() => {
    if (faq) {
      setForm(faq)
    } else {
      setForm({
        question: '',
        answer: '',
        category: 'general',
        order: 1,
        active: true,
      })
    }
  }, [faq])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{faq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
          <DialogDescription>Configure frequently asked question</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Answer</Label>
            <Textarea rows={4} value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order || 1} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TestimonialDialog({ open, onOpenChange, testimonial, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  testimonial: Testimonial | null
  onSave: (testimonial: Partial<Testimonial>) => void
}) {
  const [form, setForm] = useState<Partial<Testimonial>>({
    name: '',
    title: '',
    company: '',
    content: '',
    rating: 5,
    featured: false,
    order: 1,
    active: true,
  })

  useEffect(() => {
    if (testimonial) {
      setForm(testimonial)
    } else {
      setForm({
        name: '',
        title: '',
        company: '',
        content: '',
        rating: 5,
        featured: false,
        order: 1,
        active: true,
      })
    }
  }, [testimonial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{testimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
          <DialogDescription>Configure customer testimonial</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Testimonial Content</Label>
            <Textarea rows={4} value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rating (1-5)</Label>
              <Input type="number" min={1} max={5} value={form.rating || 5} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order || 1} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(checked) => setForm({ ...form, featured: checked })} />
              <Label>Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
              <Label>Active</Label>
            </div>
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QADialog({ open, onOpenChange, qa, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  qa: ChatbotQA | null
  onSave: (qa: Partial<ChatbotQA>) => void
}) {
  const [form, setForm] = useState<Partial<ChatbotQA>>({
    keywords: [],
    question: '',
    answer: '',
    category: 'general',
    order: 1,
    active: true,
  })

  useEffect(() => {
    if (qa) {
      setForm(qa)
    } else {
      setForm({
        keywords: [],
        question: '',
        answer: '',
        category: 'general',
        order: 1,
        active: true,
      })
    }
  }, [qa])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{qa ? 'Edit Q&A' : 'Add New Q&A'}</DialogTitle>
          <DialogDescription>Configure chatbot question and answer</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="space-y-2">
            <Label>Keywords (comma separated)</Label>
            <Input 
              value={(form.keywords || []).join(', ')} 
              onChange={(e) => setForm({ ...form, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
              placeholder="price, cost, fee, how much"
            />
            <p className="text-xs text-muted-foreground">Words that trigger this response</p>
          </div>
          <div className="space-y-2">
            <Label>Question</Label>
            <Input value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Answer</Label>
            <Textarea rows={5} value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Use \n for line breaks" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="curriculum">Curriculum</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order || 1} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter className="shrink-0 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

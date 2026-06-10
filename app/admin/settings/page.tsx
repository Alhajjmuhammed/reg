'use client'

import { useState, useEffect } from 'react'
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
  Users,
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
} from 'lucide-react'
import {
  getSiteSettings,
  updateSiteSettings,
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getAllTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
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
} from '@/lib/store'
import type {
  SiteSettings,
  HeroSlide,
  Trainer,
  CurriculumModule,
  FAQ,
  Testimonial,
  ChatbotQA,
  Package,
  PaymentMethodConfig,
  PackageType,
} from '@/lib/types'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  
  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isSlideDialogOpen, setIsSlideDialogOpen] = useState(false)
  
  // Trainers
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false)
  
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
  const [packageSeats, setPackageSeats] = useState({
    'early-bird': 40,
    'standard': 40,
    'corporate-vip': 20,
  })
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null)
  
  // Reset confirmation
  const [resetConfirm, setResetConfirm] = useState(false)

  useEffect(() => {
    setSiteSettings(getSiteSettings())
    setHeroSlides(getHeroSlides())
    setTrainers(getAllTrainers())
    setCurriculum(getAllCurriculum())
    setFaqs(getAllFAQs())
    setTestimonials(getAllTestimonials())
    setChatbotQA(getAllChatbotQA())
    setPackages(getAllPackages())
    setPaymentMethods(getAllPaymentMethods())
    const seatCfg = getSeatConfiguration()
    setPackageSeats(seatCfg.packageSeats)
  }, [])

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
    setIsSaving(true)
    updatePackageSeats(packageSeats)
    setTimeout(() => {
      setIsSaving(false)
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

  // Trainer handlers
  const handleSaveTrainer = (trainer: Partial<Trainer>) => {
    if (editingTrainer?.id) {
      updateTrainer(editingTrainer.id, trainer)
    } else {
      createTrainer(trainer as Omit<Trainer, 'id'>)
    }
    setTrainers(getAllTrainers())
    setIsTrainerDialogOpen(false)
    setEditingTrainer(null)
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
      case 'trainer':
        deleteTrainer(deleteConfirm.id)
        setTrainers(getAllTrainers())
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
    }
    setDeleteConfirm(null)
  }

  // Package update handler
  const handleUpdatePackage = (id: PackageType, data: Partial<Package>) => {
    updatePackage(id, data)
    setPackages(getAllPackages())
  }

  // Payment method update handler
  const handleUpdatePaymentMethod = (id: string, data: Partial<PaymentMethodConfig>) => {
    updatePaymentMethod(id, data)
    setPaymentMethods(getAllPaymentMethods())
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
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-1">
            <TabsTrigger value="general" className="flex items-center gap-1 text-xs">
              <Settings className="h-3 w-3" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="hero" className="flex items-center gap-1 text-xs">
              <ImageIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Hero</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Trainers</span>
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

          {/* Trainers Tab */}
          <TabsContent value="trainers" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Trainers & Speakers</CardTitle>
                  <CardDescription>Manage trainer profiles and information</CardDescription>
                </div>
                <Button onClick={() => { setEditingTrainer(null); setIsTrainerDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Trainer
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trainers.map((trainer) => (
                    <Card key={trainer.id} className="relative">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {trainer.photoUrl ? (
                              <img src={trainer.photoUrl} alt={trainer.name} className="h-full w-full object-cover" />
                            ) : (
                              <Users className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{trainer.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{trainer.title}</p>
                            <Badge variant={trainer.active ? 'default' : 'secondary'} className="mt-2">
                              {trainer.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingTrainer(trainer); setIsTrainerDialogOpen(true); }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm({ type: 'trainer', id: trainer.id })}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                <CardTitle>Pricing Packages</CardTitle>
                <CardDescription>Configure package prices and features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className={pkg.popular ? 'border-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <Switch
                            checked={pkg.active}
                            onCheckedChange={(checked) => handleUpdatePackage(pkg.id, { active: checked })}
                          />
                        </div>
                        {pkg.popular && <Badge>Most Popular</Badge>}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Price (TZS)</Label>
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => handleUpdatePackage(pkg.id, { price: parseInt(e.target.value) })}
                          />
                        </div>
                        {pkg.originalPrice !== undefined && (
                          <div className="space-y-2">
                            <Label>Original Price (TZS)</Label>
                            <Input
                              type="number"
                              value={pkg.originalPrice}
                              onChange={(e) => handleUpdatePackage(pkg.id, { originalPrice: parseInt(e.target.value) })}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Features (one per line)</Label>
                          <Textarea
                            rows={5}
                            value={pkg.features.join('\n')}
                            onChange={(e) => handleUpdatePackage(pkg.id, { features: e.target.value.split('\n').filter(f => f.trim()) })}
                          />
                        </div>
                      </CardContent>
                    </Card>
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
                  Set how many seats are allocated to each plan. Registrants can only pick seats from their own plan's zone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xs text-muted-foreground -mt-2">Seat order in the map: VIP (front) → Standard → Early Bird (back).</p>
                <div className="grid gap-6 sm:grid-cols-3">
                  {/* VIP — front rows */}
                  <div className="rounded-xl border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/40 dark:bg-purple-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm">Corporate VIP Zone</span>
                      <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded px-1.5 py-0.5 font-medium">Front</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="seats-vip" className="text-purple-700 dark:text-purple-300">Number of Seats</Label>
                      <Input
                        id="seats-vip"
                        type="number"
                        min={0}
                        max={500}
                        value={packageSeats['corporate-vip']}
                        onChange={(e) => setPackageSeats(prev => ({ ...prev, 'corporate-vip': Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="border-purple-300 dark:border-purple-700 focus-visible:ring-purple-400"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seats 1 – {packageSeats['corporate-vip']}
                    </p>
                  </div>

                  {/* Standard */}
                  <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800/50 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Standard Zone</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="seats-st" className="text-blue-700 dark:text-blue-300">Number of Seats</Label>
                      <Input
                        id="seats-st"
                        type="number"
                        min={0}
                        max={500}
                        value={packageSeats['standard']}
                        onChange={(e) => setPackageSeats(prev => ({ ...prev, 'standard': Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="border-blue-300 dark:border-blue-700 focus-visible:ring-blue-400"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seats {packageSeats['corporate-vip'] + 1} – {packageSeats['corporate-vip'] + packageSeats['standard']}
                    </p>
                  </div>

                  {/* Early Bird — back rows */}
                  <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Early Bird Zone</span>
                      <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded px-1.5 py-0.5 font-medium">Back</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="seats-eb" className="text-amber-700 dark:text-amber-300">Number of Seats</Label>
                      <Input
                        id="seats-eb"
                        type="number"
                        min={0}
                        max={500}
                        value={packageSeats['early-bird']}
                        onChange={(e) => setPackageSeats(prev => ({ ...prev, 'early-bird': Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seats {packageSeats['corporate-vip'] + packageSeats['standard'] + 1} – {packageSeats['corporate-vip'] + packageSeats['standard'] + packageSeats['early-bird']}
                    </p>
                  </div>
                </div>

                {/* Summary row */}
                <div className="rounded-lg bg-muted/50 border p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Total Venue Capacity</p>
                    <p className="text-2xl font-bold text-primary">
                      {packageSeats['early-bird'] + packageSeats['standard'] + packageSeats['corporate-vip']} seats
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div>
                      <p>Confirmed</p>
                      <p className="font-bold text-foreground">{getSeatConfiguration().confirmedSeats}</p>
                    </div>
                    <div>
                      <p>Pending</p>
                      <p className="font-bold text-foreground">{getSeatConfiguration().reservedSeats}</p>
                    </div>
                    <div>
                      <p>Waitlist</p>
                      <p className="font-bold text-foreground">{getSeatConfiguration().waitlistCount}</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSeats} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Seat Configuration'}
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
        </Tabs>
      </div>

      {/* Hero Slide Dialog */}
      <SlideDialog
        open={isSlideDialogOpen}
        onOpenChange={setIsSlideDialogOpen}
        slide={editingSlide}
        onSave={handleSaveSlide}
      />

      {/* Trainer Dialog */}
      <TrainerDialog
        open={isTrainerDialogOpen}
        onOpenChange={setIsTrainerDialogOpen}
        trainer={editingTrainer}
        onSave={handleSaveTrainer}
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{slide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
          <DialogDescription>Configure the hero slideshow content</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label>Image URL</Label>
            <Input value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/hero-1.jpg" />
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TrainerDialog({ open, onOpenChange, trainer, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainer: Trainer | null
  onSave: (trainer: Partial<Trainer>) => void
}) {
  const [form, setForm] = useState<Partial<Trainer>>({
    name: '',
    title: '',
    bio: '',
    photoUrl: '',
    expertise: [],
    stats: { trainees: 0, experience: 0, companies: 0 },
    order: 1,
    active: true,
  })

  useEffect(() => {
    if (trainer) {
      setForm(trainer)
    } else {
      setForm({
        name: '',
        title: '',
        bio: '',
        photoUrl: '',
        expertise: [],
        stats: { trainees: 0, experience: 0, companies: 0 },
        order: 1,
        active: true,
      })
    }
  }, [trainer])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trainer ? 'Edit Trainer' : 'Add New Trainer'}</DialogTitle>
          <DialogDescription>Configure trainer profile information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label>Bio</Label>
            <Textarea rows={3} value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Photo URL</Label>
            <Input value={form.photoUrl || ''} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="/images/trainer-1.jpg" />
          </div>
          <div className="space-y-2">
            <Label>Expertise (comma separated)</Label>
            <Input 
              value={(form.expertise || []).join(', ')} 
              onChange={(e) => setForm({ ...form, expertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Trainees</Label>
              <Input type="number" value={form.stats?.trainees || 0} onChange={(e) => setForm({ ...form, stats: { ...form.stats!, trainees: parseInt(e.target.value) } })} />
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input type="number" value={form.stats?.experience || 0} onChange={(e) => setForm({ ...form, stats: { ...form.stats!, experience: parseInt(e.target.value) } })} />
            </div>
            <div className="space-y-2">
              <Label>Companies</Label>
              <Input type="number" value={form.stats?.companies || 0} onChange={(e) => setForm({ ...form, stats: { ...form.stats!, companies: parseInt(e.target.value) } })} />
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
        <DialogFooter>
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module ? 'Edit Module' : 'Add New Module'}</DialogTitle>
          <DialogDescription>Configure curriculum module details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
        <DialogFooter>
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{faq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
          <DialogDescription>Configure frequently asked question</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
        <DialogFooter>
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{testimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
          <DialogDescription>Configure customer testimonial</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
        <DialogFooter>
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{qa ? 'Edit Q&A' : 'Add New Q&A'}</DialogTitle>
          <DialogDescription>Configure chatbot question and answer</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

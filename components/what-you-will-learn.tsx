'use client'

import { useState } from 'react'
import { 
  Megaphone, 
  Bot, 
  Zap, 
  Target, 
  BarChart3, 
  Workflow,
  Lightbulb,
  Users2,
  ChevronRight,
  Check
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const learningModules = [
  {
    id: 'social-media',
    icon: Megaphone,
    title: 'Social Media Management',
    subtitle: 'Master the art of social presence',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'hover:border-pink-500/50',
    topics: [
      'Content strategy and planning frameworks',
      'Platform-specific optimization (Facebook, Instagram, LinkedIn, TikTok, X)',
      'Content calendar creation and scheduling tools',
      'Engagement tactics and community management',
      'Analytics and performance tracking',
      'Crisis management and brand reputation',
    ],
    outcomes: [
      'Create a 30-day content plan for any platform',
      'Increase engagement rates by 200%+',
      'Build and manage an active online community',
      'Use analytics to make data-driven decisions',
    ],
  },
  {
    id: 'automation',
    icon: Workflow,
    title: 'Business Automation',
    subtitle: 'Streamline your operations',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'hover:border-blue-500/50',
    topics: [
      'Marketing automation fundamentals',
      'Email sequences and drip campaigns',
      'CRM integration and customer journey mapping',
      'Chatbot setup and automated responses',
      'Sales funnel automation',
      'Integration tools (Zapier, Make, n8n)',
    ],
    outcomes: [
      'Set up automated email marketing campaigns',
      'Create chatbots for customer support',
      'Integrate multiple tools for seamless workflow',
      'Save 10+ hours per week on repetitive tasks',
    ],
  },
  {
    id: 'ai-tools',
    icon: Bot,
    title: 'AI Tools & Content',
    subtitle: 'Leverage artificial intelligence',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'hover:border-purple-500/50',
    topics: [
      'Introduction to AI and machine learning basics',
      'ChatGPT and prompt engineering mastery',
      'AI image generation (Midjourney, DALL-E, Canva AI)',
      'AI video and audio tools',
      'AI writing assistants for content creation',
      'Ethical AI usage and limitations',
    ],
    outcomes: [
      'Write effective prompts for any AI tool',
      'Generate professional content 10x faster',
      'Create AI-powered marketing materials',
      'Understand AI capabilities and limitations',
    ],
  },
  {
    id: 'lead-gen',
    icon: Target,
    title: 'Lead Generation',
    subtitle: 'Build quality pipelines',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'hover:border-green-500/50',
    topics: [
      'Lead generation strategies for B2B and B2C',
      'Landing page optimization',
      'Lead magnets and value proposition design',
      'Social selling techniques',
      'Paid advertising fundamentals (Meta Ads, Google Ads)',
      'Lead nurturing and conversion optimization',
    ],
    outcomes: [
      'Create high-converting landing pages',
      'Design irresistible lead magnets',
      'Set up and optimize ad campaigns',
      'Build a predictable lead generation system',
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics & Reporting',
    subtitle: 'Data-driven decisions',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'hover:border-amber-500/50',
    topics: [
      'Key performance indicators (KPIs) for digital marketing',
      'Google Analytics 4 setup and usage',
      'Social media analytics deep dive',
      'ROI calculation and attribution models',
      'A/B testing and optimization',
      'Creating actionable reports for stakeholders',
    ],
    outcomes: [
      'Set up comprehensive tracking systems',
      'Interpret data to improve campaigns',
      'Create executive-level reports',
      'Make data-driven marketing decisions',
    ],
  },
  {
    id: 'strategy',
    icon: Lightbulb,
    title: 'Digital Strategy',
    subtitle: 'Think like a strategist',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'hover:border-teal-500/50',
    topics: [
      'Digital transformation frameworks',
      'Competitive analysis and market positioning',
      'Customer persona development',
      'Omnichannel marketing strategy',
      'Budget allocation and resource planning',
      'Scaling digital operations',
    ],
    outcomes: [
      'Develop a comprehensive digital strategy',
      'Analyze competitors and find opportunities',
      'Create detailed customer personas',
      'Plan and allocate marketing budgets effectively',
    ],
  },
]

export function WhatYouWillLearn() {
  const [activeModule, setActiveModule] = useState(learningModules[0].id)

  return (
    <section id="curriculum" className="border-b border-border py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>Comprehensive Curriculum</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground">What You Will Learn</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Our carefully crafted curriculum covers everything you need to master digital marketing,
            automation, and AI tools for modern business success.
          </p>
        </div>

        {/* Module Cards Grid - Mobile */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:hidden">
          {learningModules.map((module) => {
            const Icon = module.icon
            return (
              <Card
                key={module.id}
                className={`cursor-pointer border-border bg-card transition-all duration-200 ${module.borderColor} ${
                  activeModule === module.id ? 'border-primary shadow-lg' : ''
                }`}
                onClick={() => setActiveModule(module.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg ${module.bgColor} p-2.5`}>
                      <Icon className={`h-5 w-5 ${module.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.subtitle}</p>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 transition-transform ${
                        activeModule === module.id ? 'rotate-90 text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs - Desktop */}
        <div className="hidden lg:block">
          <Tabs value={activeModule} onValueChange={setActiveModule}>
            <TabsList className="mb-8 flex h-auto w-full flex-wrap justify-center gap-2 bg-transparent">
              {learningModules.map((module) => {
                const Icon = module.icon
                return (
                  <TabsTrigger
                    key={module.id}
                    value={module.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-primary/10"
                  >
                    <Icon className={`h-4 w-4 ${module.color}`} />
                    <span>{module.title}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {learningModules.map((module) => {
              const Icon = module.icon
              return (
                <TabsContent key={module.id} value={module.id} className="mt-0">
                  <Card className="border-border bg-card">
                    <CardContent className="p-6 lg:p-8">
                      <div className="grid gap-8 lg:grid-cols-2">
                        {/* Left Column - Topics */}
                        <div>
                          <div className="mb-4 flex items-center gap-3">
                            <div className={`rounded-lg ${module.bgColor} p-3`}>
                              <Icon className={`h-6 w-6 ${module.color}`} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">{module.title}</h3>
                              <p className="text-muted-foreground">{module.subtitle}</p>
                            </div>
                          </div>
                          <h4 className="mb-3 font-semibold text-foreground">Topics Covered:</h4>
                          <ul className="space-y-2">
                            {module.topics.map((topic, index) => (
                              <li key={index} className="flex items-start gap-2 text-muted-foreground">
                                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${module.color}`} />
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Right Column - Outcomes */}
                        <div className="rounded-lg bg-secondary/50 p-6">
                          <div className="mb-4 flex items-center gap-2">
                            <Users2 className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold text-foreground">By The End, You Will:</h4>
                          </div>
                          <ul className="space-y-3">
                            {module.outcomes.map((outcome, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3 rounded-lg bg-card p-3 shadow-sm"
                              >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                  {index + 1}
                                </div>
                                <span className="text-foreground">{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>

        {/* Mobile Content Display */}
        <div className="lg:hidden">
          {learningModules.map((module) => {
            const Icon = module.icon
            if (module.id !== activeModule) return null
            return (
              <Card key={module.id} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-lg ${module.bgColor} p-2.5`}>
                      <Icon className={`h-5 w-5 ${module.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.subtitle}</p>
                    </div>
                  </div>

                  <h4 className="mb-2 text-sm font-semibold text-foreground">Topics Covered:</h4>
                  <ul className="mb-4 space-y-1.5">
                    {module.topics.map((topic, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${module.color}`} />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-lg bg-secondary/50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-foreground">You Will Achieve:</h4>
                    <ul className="space-y-2">
                      {module.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {index + 1}
                          </div>
                          <span className="text-foreground">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

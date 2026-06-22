'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Linkedin, Twitter, Globe, Award, BookOpen, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getTrainers } from '@/lib/store'
import type { Trainer } from '@/lib/types'
import { assetUrl } from '@/lib/utils'
import { useStoreReady } from '@/components/store-provider'

interface TrainersShowcaseProps {
  initialTrainers?: Trainer[]
}

export function TrainersShowcase({ initialTrainers }: TrainersShowcaseProps) {
  const storeReady = useStoreReady()
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers ?? [])
  const [isMounted, setIsMounted] = useState(!!initialTrainers)

  useEffect(() => {
    setIsMounted(true)
    if (!storeReady) return
    setTrainers(getTrainers())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  if (!isMounted || trainers.length === 0) {
    return (
      <section id="trainers" className="border-b border-border py-16 lg:py-24 bg-secondary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Award className="h-4 w-4" />
              <span>Industry-Leading Experts</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground">Meet Your Trainers</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Learn from the best in the industry. Our trainers bring decades of combined experience
              and have trained thousands of professionals across Africa.
            </p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="trainers" className="border-b border-border py-16 lg:py-24 bg-secondary/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Award className="h-4 w-4" />
            <span>Industry-Leading Experts</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground">Meet Your Trainers</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Learn from the best in the industry. Our trainers bring decades of combined experience
            and have trained thousands of professionals across Africa.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {trainers.map((trainer) => (
            <Card
              key={trainer.id}
              className="group overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={assetUrl(trainer.photoUrl || '/images/trainer-placeholder.jpg')}
                  alt={trainer.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-foreground">{trainer.name}</h3>
                  <p className="text-sm text-primary">{trainer.title}</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {trainer.bio}
                </p>

                {/* Expertise Tags */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {trainer.expertise.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-secondary/50 p-3">
                  <div className="text-center">
                    <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{trainer.stats.trainees.toLocaleString()}+</p>
                    <p className="text-xs text-muted-foreground">Trainees</p>
                  </div>
                  <div className="text-center">
                    <BookOpen className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{trainer.stats.experience} Yrs</p>
                    <p className="text-xs text-muted-foreground">Experience</p>
                  </div>
                  <div className="text-center">
                    <Award className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{trainer.stats.companies}+</p>
                    <p className="text-xs text-muted-foreground">Companies</p>
                  </div>
                </div>

                {/* Social Links */}
                {trainer.social && (
                  <div className="flex items-center gap-3">
                    {trainer.social.linkedin && (
                      <a
                        href={trainer.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                        aria-label={`${trainer.name} LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {trainer.social.twitter && (
                      <a
                        href={trainer.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                        aria-label={`${trainer.name} Twitter`}
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {trainer.social.website && (
                      <a
                        href={trainer.social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-secondary p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                        aria-label={`${trainer.name} Website`}
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

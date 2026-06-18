import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { SponsorshipApplication } from '@/lib/types'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data } = await supabase
    .from('app_store').select('value')
    .eq('key', 'masterclass_sponsorship_applications').maybeSingle()

  const apps: SponsorshipApplication[] = (data?.value as SponsorshipApplication[]) || []
  const application = apps.find(a => a.id === id) ?? null

  return NextResponse.json({ application })
}

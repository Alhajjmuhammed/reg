import { serverGetSponsorshipTiers, serverGetSponsors, serverGetSponsorshipSettings } from '@/lib/server-data'
import { SponsorshipContent } from './content'

export default function SponsorshipPage() {
  const tiers = serverGetSponsorshipTiers()
  const sponsors = serverGetSponsors()
  const settings = serverGetSponsorshipSettings()

  return (
    <SponsorshipContent
      initialTiers={tiers}
      initialSponsors={sponsors}
      initialSettings={settings}
    />
  )
}

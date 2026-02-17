import { getGamificationData, getUserProfile, getUserStats } from './profile/actions'
import { getMorphoProfile } from './morphology/actions'
import HomeContent from './home-content'

export default async function HomePage() {
  const [profile, gamification, stats, morphoProfile] = await Promise.all([
    getUserProfile(),
    getGamificationData(),
    getUserStats(),
    getMorphoProfile(),
  ])

  return (
    <HomeContent
      profile={profile}
      gamification={gamification}
      stats={stats}
      morphoProfile={morphoProfile}
    />
  )
}

import { getGamificationData, getUserProfile, getUserStats, getWeeklyComparison } from './profile/actions'
import { getMorphoProfile } from './morphology/actions'
import HomeContent from './home-content'

export default async function HomePage() {
  const [profile, gamification, stats, morphoProfile, weeklyComparison] = await Promise.all([
    getUserProfile(),
    getGamificationData(),
    getUserStats(),
    getMorphoProfile(),
    getWeeklyComparison(),
  ])

  return (
    <HomeContent
      profile={profile}
      gamification={gamification}
      stats={stats}
      morphoProfile={morphoProfile}
      weeklyComparison={weeklyComparison}
    />
  )
}

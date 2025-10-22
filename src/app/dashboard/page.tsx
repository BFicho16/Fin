import { createClient } from '@/lib/supabase/server'
import ChatInterface from '@/components/health/ChatInterface'
import DashboardPanel from '@/components/health/DashboardPanel'
import MobileDashboardDrawer from '@/components/health/MobileDashboardDrawer'
import OnboardingEmptyState from '@/components/health/OnboardingEmptyState'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-3">
            Please log in to access your health dashboard
          </h2>
        </div>
      </div>
    )
  }

  // Check user's onboarding status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  const isOnboarding = !profile?.onboarding_completed

  return (
    <>
      <div className="h-full flex flex-col lg:grid lg:grid-cols-2 gap-3 p-4">
        {/* Left Column - Chat Interface */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0">
            <ChatInterface 
              userId={user.id} 
              userEmail={user.email} 
              isOnboarding={isOnboarding}
            />
          </div>
        </div>

        {/* Right Column - Dashboard Panel or Onboarding Empty State */}
        <div className="hidden lg:block overflow-y-auto">
          {isOnboarding ? (
            <OnboardingEmptyState />
          ) : (
            <DashboardPanel userId={user.id} />
          )}
        </div>
      </div>

      {/* Mobile Dashboard Drawer - only show if not onboarding */}
      {!isOnboarding && <MobileDashboardDrawer userId={user.id} />}
    </>
  )
}

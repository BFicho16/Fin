import { createClient } from '@/lib/supabase/server'
import GuestOnboarding from '@/features/onboarding/guest-onboarding'
import { PageOverlayProvider } from '@/components/page-overlay'
import ChatPageLayout from '@/components/layouts/chat-page-layout'
import PageTabs from '@/components/page-tabs'
import UpgradeModal from '@/components/subscription/upgrade-modal'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Handle both authenticated and non-authenticated users on the root route
  // Authenticated users get the app with chat interface
  // Non-authenticated users get guest onboarding
  if (user) {
    return (
      <PageOverlayProvider>
        <div className="h-full bg-muted/50">
          <main className="h-full flex flex-col">
            <ChatPageLayout
              userId={user.id}
              userEmail={user.email || ''}
              contentComponent={<PageTabs userId={user.id} />}
            />
          </main>
        </div>
        <UpgradeModal userId={user.id} />
      </PageOverlayProvider>
    )
  }
  
  return <GuestOnboarding />
}

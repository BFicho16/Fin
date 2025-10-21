import { createClient } from '@/lib/supabase/server'
import ChatInterface from '@/components/health/ChatInterface'
import DashboardPanel from '@/components/health/DashboardPanel'
import MobileDashboardDrawer from '@/components/health/MobileDashboardDrawer'
import LogoutButton from '@/components/LogoutButton'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please log in to access your health dashboard
          </h2>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col lg:grid lg:grid-cols-2 gap-6 p-6">
        {/* Left Column - Chat Interface with Header */}
        <div className="flex flex-col h-full min-h-0">
          {/* Header for left column only */}
          <Card className="mb-4 rounded-none border-x-0 border-t-0 shadow-sm">
            <div className="px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold">Deep Research Assistant</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-muted-foreground text-sm">Welcome, {user.email}</span>
                  <Separator orientation="vertical" className="h-6" />
                  <LogoutButton />
                </div>
              </div>
            </div>
          </Card>
          
          {/* Chat Interface */}
          <div className="flex-1 min-h-0">
            <ChatInterface userId={user.id} />
          </div>
        </div>

        {/* Right Column - Dashboard Panel (Desktop) */}
        <div className="hidden lg:block overflow-y-auto">
          <DashboardPanel userId={user.id} />
        </div>
      </div>

      {/* Mobile Dashboard Drawer */}
      <MobileDashboardDrawer userId={user.id} />
    </>
  )
}

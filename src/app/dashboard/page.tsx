import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'

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

  return (
    <DashboardClient 
      userId={user.id} 
      userEmail={user.email}
    />
  )
}

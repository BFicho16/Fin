import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingSessionsList from '@/components/admin/OnboardingSessionsList'

const ALLOWED_EMAILS = new Set([
  'gdcaplan@gmail.com',
  'brian.ficho@gmail.com',
])

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email || !ALLOWED_EMAILS.has(user.email)) {
    redirect('/')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-muted-foreground mt-2">Guest onboarding conversations</p>
      <div className="mt-6">
        <OnboardingSessionsList />
      </div>
    </div>
  )
}



import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GuestOnboardingClient from '@/components/onboarding/GuestOnboardingClient'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }
  
  return <GuestOnboardingClient />
}

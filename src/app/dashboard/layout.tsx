import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="h-full bg-muted/50">
      <main className="h-full flex flex-col">
        {children}
      </main>
    </div>
  )
}

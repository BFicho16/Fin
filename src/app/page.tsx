import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          <h1 className="text-4xl font-bold mb-6">
            Deep Research Assistant
          </h1>
          <p className="text-muted-foreground mb-8">
            Your AI-powered health and wellness companion
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login">
                Login
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">
                Sign Up
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

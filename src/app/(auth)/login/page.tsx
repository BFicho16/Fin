'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'magiclink'>('password')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (loginMethod === 'password') {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      }
    } else {
      // Magic link login
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the magic link to sign in.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Or{' '}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/90"
          >
            create a new account
          </Link>
        </p>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={loginMethod === 'password' ? 'default' : 'outline'}
          onClick={() => {
            setLoginMethod('password')
            setError('')
            setMessage('')
          }}
          className="flex-1"
        >
          Password
        </Button>
        <Button
          type="button"
          variant={loginMethod === 'magiclink' ? 'default' : 'outline'}
          onClick={() => {
            setLoginMethod('magiclink')
            setError('')
            setMessage('')
          }}
          className="flex-1"
        >
          Magic Link
        </Button>
      </div>
      
      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {loginMethod === 'password' && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading 
            ? (loginMethod === 'password' ? 'Signing in...' : 'Sending magic link...')
            : (loginMethod === 'password' ? 'Sign in' : 'Send magic link')
          }
        </Button>
      </form>
    </div>
  )
}

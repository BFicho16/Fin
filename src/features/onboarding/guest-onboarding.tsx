'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GuestChatInterface from '@/components/chat/guest-chat-interface';
import GuestOnboardingContent from '@/features/onboarding/guest-onboarding-content';
import ChatPageLayout from '@/components/layouts/chat-page-layout';
import { api } from '@/lib/trpc-client';

export default function GuestOnboarding() {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [isContentOpen, setIsContentOpen] = useState(false);
  const hasRedirectedRef = useRef(false);
  const router = useRouter();
  
  // Use React Query to fetch guest progress
  const { data: progressData } = api.guest.getProgress.useQuery(
    { sessionId: guestSessionId! },
    { enabled: !!guestSessionId }
  );
  
  const handleAnalyzeRoutine = useCallback(async () => {
    if (!progressData?.email || !guestSessionId) {
      return;
    }

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'OnboardingComplete');
    }

    try {
      // Call complete-onboarding API to create account and sign in
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: progressData.email,
          guestSessionId: guestSessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to complete onboarding:', errorData);
        alert('Failed to create account. Please try again.');
        return;
      }

      const { session } = await response.json();

      // Set session in Supabase client
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (sessionError) {
        console.error('Failed to set session:', sessionError);
        alert('Account created but failed to sign in. Please try logging in.');
        router.push('/login');
        return;
      }

      // Clear guest session from storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('guestSessionId');
      }

      // Redirect to home page (authenticated)
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('An error occurred. Please try again.');
    }
  }, [progressData?.email, guestSessionId, router]);

  useEffect(() => {
    if (
      progressData?.progress?.isComplete &&
      progressData?.email &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      handleAnalyzeRoutine();
    }
  }, [progressData, handleAnalyzeRoutine]);
  
  return (
    <ChatPageLayout
      userId=""
      userEmail=""
      contentTitle="Longevity Profile"
      isContentOpen={isContentOpen}
      onContentOpenChange={setIsContentOpen}
      chatComponent={
        <GuestChatInterface
          guestSessionId={guestSessionId}
          onSessionIdReceived={setGuestSessionId}
          progressData={progressData}
          onContentOpenChange={setIsContentOpen}
        />
      }
      contentComponent={
        <GuestOnboardingContent
          progressData={progressData}
          onAnalyzeRoutine={handleAnalyzeRoutine}
        />
      }
    />
  );
}


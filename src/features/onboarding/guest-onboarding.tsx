'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GuestChatInterface from '@/components/chat/guest-chat-interface';
import GuestOnboardingContent from '@/features/onboarding/guest-onboarding-content';
import ChatPageLayout from '@/components/layouts/chat-page-layout';

export default function GuestOnboarding() {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [isContentOpen, setIsContentOpen] = useState(false);
  const hasRedirectedRef = useRef(false);
  const router = useRouter();
  
  
  const fetchProgress = useCallback(async () => {
    if (!guestSessionId) return;

    try {
      console.log('🔍 GuestOnboarding: Fetching progress for session:', guestSessionId);
      const res = await fetch(`/api/guest/progress?sessionId=${guestSessionId}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('❌ GuestOnboarding: Failed to fetch progress', {
          status: res.status,
          statusText: res.statusText,
        });
        return;
      }

      const data = await res.json();
      console.log('📊 GuestOnboarding: Progress data received:', {
        hasProfile: !!data.profile?.birth_date && !!data.profile?.gender,
        hasHealthMetrics: !!data.healthMetrics?.length,
        bedtimeSaved: !!data.sleepRoutine?.night?.bedtime,
        wakeTimeSaved: !!data.sleepRoutine?.morning?.wake_time,
        preBedHabits: data.sleepRoutine?.night?.pre_bed?.length || 0,
        progressComplete: data.progress?.isComplete,
      });
      setProgressData(data);
    } catch (error) {
      console.error('❌ GuestOnboarding: Error fetching progress', error);
    }
  }, [guestSessionId]);

  // Fetch initial progress data
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);
  
  // Set up real-time subscription for guest session updates
  useEffect(() => {
    if (!guestSessionId) return;
    
    const supabase = createClient();
    
    // Subscribe to changes on the guest session row
    const channel = supabase
      .channel(`guest-session-${guestSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guest_onboarding_sessions',
          filter: `session_id=eq.${guestSessionId}`,
        },
        async (payload) => {
          console.log('🔔 GuestOnboarding: Realtime payload received', payload.eventType);
          await fetchProgress();
        }
      )
      .subscribe((status) => {
        console.log('📡 GuestOnboarding: Realtime channel status', status);
      });
    
    return () => {
      console.log('🔌 GuestOnboarding: Unsubscribing realtime channel');
      channel.unsubscribe();
    };
  }, [guestSessionId, fetchProgress]);
  
  const navigateToConfirmation = useCallback(() => {
    if (!guestSessionId) return;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('guestSessionId', guestSessionId);
    }

    router.push('/waitlist/confirmation');
  }, [guestSessionId, router]);

  const handleAnalyzeRoutine = useCallback(() => {
    if (!progressData?.email) {
      return;
    }

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'OnboardingComplete');
    }

    navigateToConfirmation();
  }, [progressData?.email, navigateToConfirmation]);

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
          onProgressRefresh={fetchProgress}
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


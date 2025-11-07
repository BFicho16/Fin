'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GuestChatInterface from '@/components/onboarding/GuestChatInterface';
import GuestOnboardingTracker from '@/components/onboarding/GuestOnboardingTracker';
import MobileGuestOnboardingDrawer from '@/components/onboarding/MobileGuestOnboardingDrawer';

export default function GuestOnboardingClient() {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hasRedirectedRef = useRef(false);
  const router = useRouter();
  
  
  const fetchProgress = useCallback(async () => {
    if (!guestSessionId) return;

    try {
      console.log('🔍 GuestOnboardingClient: Fetching progress for session:', guestSessionId);
      const res = await fetch(`/api/guest/progress?sessionId=${guestSessionId}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('❌ GuestOnboardingClient: Failed to fetch progress', {
          status: res.status,
          statusText: res.statusText,
        });
        return;
      }

      const data = await res.json();
      console.log('📊 GuestOnboardingClient: Progress data received:', {
        hasProfile: !!data.profile?.birth_date && !!data.profile?.gender,
        hasHealthMetrics: !!data.healthMetrics?.length,
        bedtimeSaved: !!data.sleepRoutine?.night?.bedtime,
        wakeTimeSaved: !!data.sleepRoutine?.morning?.wake_time,
        preBedHabits: data.sleepRoutine?.night?.pre_bed?.length || 0,
        progressComplete: data.progress?.isComplete,
      });
      setProgressData(data);
    } catch (error) {
      console.error('❌ GuestOnboardingClient: Error fetching progress', error);
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
          console.log('🔔 GuestOnboardingClient: Realtime payload received', payload.eventType);
          await fetchProgress();
        }
      )
      .subscribe((status) => {
        console.log('📡 GuestOnboardingClient: Realtime channel status', status);
      });
    
    return () => {
      console.log('🔌 GuestOnboardingClient: Unsubscribing realtime channel');
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
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 p-4 h-full overflow-hidden">
      <div className="flex-1 min-h-0">
        <GuestChatInterface 
          guestSessionId={guestSessionId}
          onSessionIdReceived={setGuestSessionId}
          progressData={progressData}
          onProgressRefresh={fetchProgress}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      </div>
      <div className="flex-1 min-h-0 hidden lg:block">
        <GuestOnboardingTracker 
          progressData={progressData}
          onAnalyzeRoutine={handleAnalyzeRoutine}
        />
      </div>
      
      {/* Mobile Drawer */}
      <MobileGuestOnboardingDrawer
        progressData={progressData}
        onAnalyzeRoutine={handleAnalyzeRoutine}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}

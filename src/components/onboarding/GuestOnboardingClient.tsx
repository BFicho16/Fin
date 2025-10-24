'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import GuestChatInterface from '@/components/onboarding/GuestChatInterface';
import GuestOnboardingTracker from '@/components/onboarding/GuestOnboardingTracker';
import MobileGuestOnboardingDrawer from '@/components/onboarding/MobileGuestOnboardingDrawer';

export default function GuestOnboardingClient() {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  
  // Fetch initial progress data
  useEffect(() => {
    if (!guestSessionId) return;
    
    const fetchProgress = async () => {
      console.log('🔍 GuestOnboardingClient: Fetching progress for session:', guestSessionId);
      const res = await fetch(`/api/guest/progress?sessionId=${guestSessionId}`);
      const data = await res.json();
      console.log('📊 GuestOnboardingClient: Progress data received:', {
        hasProfile: !!data.profile?.birth_date && !!data.profile?.gender,
        hasHealthMetrics: !!data.healthMetrics?.length,
        routinesCount: data.routines?.length || 0,
        routineItemsCount: data.routines?.reduce((total: number, r: any) => total + (r.items?.length || 0), 0) || 0,
        progressComplete: data.progress?.isComplete
      });
      setProgressData(data);
    };
    
    fetchProgress();
  }, [guestSessionId]);
  
  // Set up real-time subscription for guest session updates
  useEffect(() => {
    if (!guestSessionId) return;
    
    const supabase = createClient();
    
    // Subscribe to changes on the guest session row
    const subscription = supabase
      .channel(`guest-session-${guestSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guest_onboarding_sessions',
          filter: `session_id=eq.${guestSessionId}`,
        },
        async (payload) => {
          // Fetch updated progress data
          const res = await fetch(`/api/guest/progress?sessionId=${guestSessionId}`);
          const data = await res.json();
          setProgressData(data);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [guestSessionId]);
  
  const handleGetStarted = () => {
    // Store session ID for signup
    sessionStorage.setItem('guestSessionId', guestSessionId!);
    window.location.href = '/signup';
  };
  
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 p-4 h-full overflow-hidden">
      <div className="flex-1 min-h-0">
        <GuestChatInterface 
          guestSessionId={guestSessionId}
          onSessionIdReceived={setGuestSessionId}
          progressData={progressData}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      </div>
      <div className="flex-1 min-h-0 hidden lg:block">
        <GuestOnboardingTracker 
          progressData={progressData}
          onGetStarted={handleGetStarted}
        />
      </div>
      
      {/* Mobile Drawer */}
      <MobileGuestOnboardingDrawer
        progressData={progressData}
        onGetStarted={handleGetStarted}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}

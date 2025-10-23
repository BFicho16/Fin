'use client';

import { useState } from 'react';
import ChatInterface from '@/components/health/ChatInterface';
import DashboardPanel from '@/components/health/DashboardPanel';
import MobileDashboardDrawer from '@/components/health/MobileDashboardDrawer';
import OnboardingProgressTracker from '@/components/onboarding/OnboardingProgressTracker';
import MobileOnboardingDrawer from '@/components/onboarding/MobileOnboardingDrawer';

interface DashboardClientProps {
  userId: string;
  userEmail: string;
  isOnboarding: boolean;
}

export default function DashboardClient({ userId, userEmail, isOnboarding }: DashboardClientProps) {
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  return (
    <>
      <div className="h-full flex flex-col lg:grid lg:grid-cols-2 gap-3 p-4">
        {/* Left Column - Chat Interface */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0">
            <ChatInterface 
              userId={userId} 
              userEmail={userEmail} 
              isOnboarding={isOnboarding}
              isTrackerOpen={isTrackerOpen}
              onTrackerOpenChange={setIsTrackerOpen}
            />
          </div>
        </div>

        {/* Right Column - Dashboard Panel or Onboarding Progress Tracker */}
        <div className="hidden lg:block overflow-y-auto">
          {isOnboarding ? (
            <OnboardingProgressTracker userId={userId} />
          ) : (
            <DashboardPanel userId={userId} />
          )}
        </div>
      </div>

      {/* Mobile Dashboard Drawer - only show if not onboarding */}
      {!isOnboarding && <MobileDashboardDrawer userId={userId} />}

      {/* Mobile Onboarding Drawer - only show if onboarding */}
      {isOnboarding && (
        <MobileOnboardingDrawer 
          userId={userId} 
          isOpen={isTrackerOpen}
          onOpenChange={setIsTrackerOpen}
        />
      )}
    </>
  );
}

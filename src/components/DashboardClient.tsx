'use client';

import { useState } from 'react';
import ChatInterface from '@/components/health/ChatInterface';
import DashboardPanel from '@/components/health/DashboardPanel';
import MobileDashboardDrawer from '@/components/health/MobileDashboardDrawer';

interface DashboardClientProps {
  userId: string;
  userEmail: string;
}

export default function DashboardClient({ userId, userEmail }: DashboardClientProps) {
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
              isTrackerOpen={isTrackerOpen}
              onTrackerOpenChange={setIsTrackerOpen}
            />
          </div>
        </div>

        {/* Right Column - Dashboard Panel */}
        <div className="hidden lg:block overflow-y-auto">
          <DashboardPanel userId={userId} />
        </div>
      </div>

      {/* Mobile Dashboard Drawer */}
      <MobileDashboardDrawer userId={userId} />
    </>
  );
}



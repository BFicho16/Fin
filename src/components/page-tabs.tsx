'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageOverlay } from '@/components/page-overlay';
import MyRoutineTab from '@/features/my-routine/my-routine-tab';
import ActivityLogTab from '@/features/activity-log/activity-log-tab';
import ProfileTab from '@/features/profile/profile-tab';

interface PageTabsProps {
  userId: string;
}

export default function PageTabs({ userId }: PageTabsProps) {
  const { activeTab, setActiveTab } = usePageOverlay();

  return (
    <div className="h-full flex flex-col">
      {/* Temporarily hide tabs - just show MyRoutineTab */}
      <MyRoutineTab userId={userId} />
      
      {/* 
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="w-full justify-start sticky top-0 z-10 bg-background border-b">
          <TabsTrigger value="my-routine">My Routine</TabsTrigger>
          <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="my-routine" className="m-0">
            <MyRoutineTab userId={userId} />
          </TabsContent>
          <TabsContent value="activity-log" className="m-0">
            <ActivityLogTab userId={userId} />
          </TabsContent>
          <TabsContent value="profile" className="m-0">
            <ProfileTab userId={userId} />
          </TabsContent>
        </div>
      </Tabs>
      */}
    </div>
  );
}


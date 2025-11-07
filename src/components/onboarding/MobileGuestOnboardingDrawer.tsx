'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import GuestOnboardingTracker from './GuestOnboardingTracker';

interface MobileGuestOnboardingDrawerProps {
  progressData: any;
  onAnalyzeRoutine: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileGuestOnboardingDrawer({ 
  progressData, 
  onAnalyzeRoutine, 
  isOpen, 
  onOpenChange 
}: MobileGuestOnboardingDrawerProps) {
  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] p-0 transition-all duration-300 h-[100dvh]"
        >
          <SheetTitle className="sr-only">Longevity Profile</SheetTitle>
          <div className="h-full overflow-y-auto">
            <GuestOnboardingTracker 
              progressData={progressData}
              onAnalyzeRoutine={onAnalyzeRoutine}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import OnboardingProgressTracker from './OnboardingProgressTracker';

interface MobileOnboardingDrawerProps {
  userId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileOnboardingDrawer({ userId, isOpen, onOpenChange }: MobileOnboardingDrawerProps) {
  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] p-0 transition-all duration-300"
        >
          <SheetTitle className="sr-only">Onboarding Progress Tracker</SheetTitle>
          <div className="h-full overflow-y-auto">
            <OnboardingProgressTracker userId={userId} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
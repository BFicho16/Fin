'use client';

import GuestOnboardingTracker from './guest-onboarding-tracker';

interface GuestOnboardingContentProps {
  progressData: any;
  onAnalyzeRoutine: () => void;
}

export default function GuestOnboardingContent({
  progressData,
  onAnalyzeRoutine,
}: GuestOnboardingContentProps) {
  return (
    <GuestOnboardingTracker
      progressData={progressData}
      onAnalyzeRoutine={onAnalyzeRoutine}
    />
  );
}


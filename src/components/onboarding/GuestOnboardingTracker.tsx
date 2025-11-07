'use client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, BedSingle, Info, HeartPulse } from 'lucide-react';
import SleepRoutineProgressCard from './SleepRoutineProgress';
import { ensureSleepRoutineShape, calculateSleepRoutineProgress } from '@/lib/sleepRoutine';
import { Input } from '@/components/ui/input';

interface GuestOnboardingTrackerProps {
  progressData: any;
  onAnalyzeRoutine: () => void;
}

export default function GuestOnboardingTracker({ progressData, onAnalyzeRoutine }: GuestOnboardingTrackerProps) {

  if (!progressData) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <BedSingle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Bedtime Routine</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  const { progress, sleepRoutine: rawSleepRoutine } = progressData;
  const sleepRoutine = ensureSleepRoutineShape(rawSleepRoutine);
  const sleepProgress = progress?.sleepProgress || calculateSleepRoutineProgress(sleepRoutine);
  const isComplete = progress?.isComplete || false;
  const email = progressData?.email ?? '';
  const hasEmail = typeof email === 'string' && email.length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center space-x-2">
          <BedSingle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Sleep Routine</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Share your typical sleep routine for analysis
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <SleepRoutineProgressCard 
          sleepRoutine={sleepRoutine}
          progress={sleepProgress}
        />

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Input
              value={email}
              readOnly
              placeholder="Email address"
              className="flex-1"
            />
            <Button 
              onClick={onAnalyzeRoutine}
              disabled={!hasEmail || !isComplete}
              className="w-full sm:w-auto"
            >
              Analyze Routine
            </Button>
          </div>
        </div>

        <Alert className="bg-primary/10 border-primary/20">
          <div className="flex flex-col items-start space-y-3">
            <div className="p-2 rounded-full bg-primary/15 text-primary">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <AlertTitle className="text-base font-semibold text-primary">Sleep Paramount to Longevity</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                Sleep is the foundation of long-term health and vitality. It’s the first routine we’ll analyze and optimize together so the rest of your wellness habits can thrive.
              </AlertDescription>
            </div>
          </div>
        </Alert>

      </div>

      {/* Footer helper text */}
      {!isComplete && (
        <div className="border-t p-4 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Add your bedtime, wake time, and wind-down habits to continue.
          </p>
        </div>
      )}
    </div>
  );
}

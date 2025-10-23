'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle } from 'lucide-react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';

// Type assertion to fix React 19 type conflicts
const CardComponent = Card as any;
const CardHeaderComponent = CardHeader as any;
const CardContentComponent = CardContent as any;
const CheckCircleIcon = CheckCircle as any;
const CircleIcon = Circle as any;

interface CompactOnboardingTrackerProps {
  userId: string;
  onOpen: () => void;
}

const DAY_ABBREVIATIONS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CompactOnboardingTracker({ userId, onOpen }: CompactOnboardingTrackerProps) {
  const { categoryStatuses, isLoading, error } = useOnboardingProgress(userId);

  // Handle error state
  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-red-500 text-center p-2">
          Error loading progress
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardComponent key={i} className="p-2">
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardComponent>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <CardComponent key={i} className="p-2">
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardComponent>
          ))}
        </div>
      </div>
    );
  }

  // Demographics & Health Metrics
  const demographics = categoryStatuses?.find(s => s.id === 'demographics');
  const healthMetrics = categoryStatuses?.find(s => s.id === 'healthMetrics');
  const profile = demographics?.data?.profile;
  const metrics = healthMetrics?.data?.metrics || [];

  const hasAge = !!profile?.birth_date;
  const hasGender = !!profile?.gender;
  const hasWeight = metrics.some((m: any) => m.metric_type === 'weight');
  const hasHeight = metrics.some((m: any) => m.metric_type === 'height');

  // Routines - check each day
  const routinesStatus = categoryStatuses?.find(s => s.id === 'routines');
  const routines = routinesStatus?.data?.routines || [];
  const activeRoutines = routines.filter((r: any) => r.status === 'active');

  const dayCompletionStatus = [0, 1, 2, 3, 4, 5, 6].map(day => {
    const morningRoutine = activeRoutines.find((r: any) => 
      r.time_of_day === 'morning' && 
      r.schedule_config?.days_of_week?.includes(day)
    );
    const nightRoutine = activeRoutines.find((r: any) => 
      r.time_of_day === 'night' && 
      r.schedule_config?.days_of_week?.includes(day)
    );
    
    return (morningRoutine?.routine_items?.length > 0) && 
           (nightRoutine?.routine_items?.length > 0);
  });

  return (
    <div className="space-y-2 cursor-pointer" onClick={onOpen}>
      {/* Demographics & Health Metrics Row */}
      <div className="grid grid-cols-4 gap-1">
        {/* Age Card */}
        <CardComponent className={`transition-all p-2 ${hasAge ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <CardHeaderComponent className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
            <CardTitle className="text-xs font-medium">Age</CardTitle>
            {hasAge ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <CircleIcon className="h-3 w-3 text-gray-400" />
            )}
          </CardHeaderComponent>
        </CardComponent>

        {/* Gender Card */}
        <CardComponent className={`transition-all p-2 ${hasGender ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <CardHeaderComponent className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
            <CardTitle className="text-xs font-medium">Gender</CardTitle>
            {hasGender ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <CircleIcon className="h-3 w-3 text-gray-400" />
            )}
          </CardHeaderComponent>
        </CardComponent>

        {/* Weight Card */}
        <CardComponent className={`transition-all p-2 ${hasWeight ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <CardHeaderComponent className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
            <CardTitle className="text-xs font-medium">Weight</CardTitle>
            {hasWeight ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <CircleIcon className="h-3 w-3 text-gray-400" />
            )}
          </CardHeaderComponent>
        </CardComponent>

        {/* Height Card */}
        <CardComponent className={`transition-all p-2 ${hasHeight ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <CardHeaderComponent className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
            <CardTitle className="text-xs font-medium">Height</CardTitle>
            {hasHeight ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <CircleIcon className="h-3 w-3 text-gray-400" />
            )}
          </CardHeaderComponent>
        </CardComponent>
      </div>

      {/* Weekly Routine Days Row */}
      <div className="grid grid-cols-7 gap-1">
        {dayCompletionStatus.map((isComplete, index) => (
          <CardComponent 
            key={index} 
            className={`transition-all p-2 ${isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
          >
            <CardContentComponent className="flex flex-row items-center justify-center space-x-1 p-0">
              <div className="text-xs font-medium">
                {DAY_ABBREVIATIONS[index]}
              </div>
              {isComplete ? (
                <CheckCircleIcon className="h-3 w-3 text-green-600" />
              ) : (
                <CircleIcon className="h-3 w-3 text-gray-400" />
              )}
            </CardContentComponent>
          </CardComponent>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Circle, ChevronDown, ChevronRight, Loader2, User, Heart, TrendingUp, BarChart3, Utensils } from 'lucide-react';
import { getAllCategories } from './onboardingConfig';
import WeeklyRoutineProgress from './WeeklyRoutineProgress';
import { formatHeight } from '@/lib/unitConversions';

interface GuestOnboardingTrackerProps {
  progressData: any;
  onGetStarted: () => void;
}

export default function GuestOnboardingTracker({ progressData, onGetStarted }: GuestOnboardingTrackerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());


  const toggleExpanded = (categoryId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (!progressData) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Longevity Profile</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  const categories = getAllCategories();
  const { progress } = progressData;
  const isComplete = progress?.isComplete || false;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Longevity Profile</h2>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {/* Demographics and Health Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Age Card */}
          <Card className={`transition-all ${progress?.hasProfile ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Age</CardTitle>
              {progress?.hasProfile ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </CardHeader>
            <CardContent>
              {progress?.hasProfile && progressData.profile?.birth_date ? (
                <div>
                  <div className="text-2xl font-bold">
                    {new Date().getFullYear() - new Date(progressData.profile.birth_date).getFullYear()}
                  </div>
                  <p className="text-[10px] text-muted-foreground">years</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                  <p className="text-[10px] text-muted-foreground">years</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gender Card */}
          <Card className={`transition-all ${progress?.hasProfile ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Gender</CardTitle>
              {progress?.hasProfile ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </CardHeader>
            <CardContent>
              {progress?.hasProfile && progressData.profile?.gender ? (
                <div className="text-2xl font-bold">
                  {progressData.profile.gender.charAt(0).toUpperCase() + progressData.profile.gender.slice(1)}
                </div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">-</div>
              )}
            </CardContent>
          </Card>

          {/* Weight Card */}
          <Card className={`transition-all ${progress?.hasHealthMetrics ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Weight</CardTitle>
              {progress?.hasHealthMetrics ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </CardHeader>
            <CardContent>
              {progress?.hasHealthMetrics && progressData.healthMetrics?.find((m: any) => m.metric_type === 'weight') ? (
                <div>
                  <div className="text-2xl font-bold">
                    {progressData.healthMetrics.find((m: any) => m.metric_type === 'weight')?.value}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {progressData.healthMetrics.find((m: any) => m.metric_type === 'weight')?.unit}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                  <p className="text-[10px] text-muted-foreground">lbs</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Height Card */}
          <Card className={`transition-all ${progress?.hasHealthMetrics ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">Height</CardTitle>
              {progress?.hasHealthMetrics ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </CardHeader>
            <CardContent>
              {progress?.hasHealthMetrics && progressData.healthMetrics?.find((m: any) => m.metric_type === 'height') ? (
                (() => {
                  const heightMetric = progressData.healthMetrics.find((m: any) => m.metric_type === 'height');
                  // Convert height to cm based on the stored unit, then format for display
                  let heightInCm;
                  if (heightMetric.unit === 'in') {
                    heightInCm = heightMetric.value * 2.54; // inches to cm
                  } else if (heightMetric.unit === 'ft') {
                    heightInCm = heightMetric.value * 30.48; // feet to cm
                  } else {
                    heightInCm = heightMetric.value; // already in cm
                  }
                  const formattedHeight = formatHeight(heightInCm, 'imperial');
                  return (
                    <div>
                      <div className="text-2xl font-bold">
                        {formattedHeight}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        ft/in
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                  <p className="text-[10px] text-muted-foreground">ft/in</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dietary Preferences */}
        <Card className="border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Utensils className="h-4 w-4 text-gray-600" />
                  <div>
                    <h3 className="text-sm font-medium">Dietary Preferences</h3>
                    <p className="text-xs text-muted-foreground">Allergies, restrictions, food preferences (optional)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {progressData.dietaryPreferences ? Object.keys(progressData.dietaryPreferences).length : 0} items
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routines */}
        <WeeklyRoutineProgress 
          routines={progressData.routines || []} 
          isGuest={true}
        />
      </div>

      {/* Fixed Footer with Get Started Button */}
      <div className="border-t p-4 flex-shrink-0">
        <Button 
          onClick={onGetStarted}
          disabled={!isComplete}
          className="w-full"
        >
          Analyze My Routine
        </Button>
        {!isComplete && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Complete all required categories to continue
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle, Sun, Moon, Utensils, Dumbbell, Plus, Send } from 'lucide-react';
import { calculateWeeklyRoutineProgress, getRoutineSlotStatus, DayRoutineStatus } from '@/lib/routineProgress';

// Type assertion to fix React 19 type conflicts
const CardComponent = Card as any;
const CardContentComponent = CardContent as any;
const CheckCircleIcon = CheckCircle as any;
const CircleIcon = Circle as any;

interface Routine {
  id: string;
  routine_name: string;
  description?: string;
  status: 'pending' | 'active' | 'archived';
  schedule_type: 'weekly' | 'monthly' | 'yearly';
  schedule_config: {
    days_of_week?: number[];
    days_of_month?: number[];
    days_of_year?: string[];
  };
  time_of_day?: 'morning' | 'midday' | 'night' | 'workout';
  created_at: string;
  updated_at: string;
  routine_items?: RoutineItem[];
}

interface RoutineItem {
  id: string;
  item_name: string;
  item_type: string;
  duration_minutes?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  distance_km?: number;
  calories?: number;
  serving_size?: string;
  notes?: string;
  item_order: number;
  is_optional: boolean;
  habit_classification?: 'good' | 'bad' | 'neutral';
}

interface WeeklyRoutineProgressProps {
  userId?: string;
  routines: Routine[];
  isGuest?: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREVIATIONS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function WeeklyRoutineProgress({ userId, routines, isGuest }: WeeklyRoutineProgressProps) {
  const [progress, setProgress] = useState(calculateWeeklyRoutineProgress(routines));
  const [activeTab, setActiveTab] = useState('Sunday');

  // Transform guest routines to the expected format
  const transformGuestRoutines = (guestRoutines: any[]) => {
    return guestRoutines.map(routine => ({
      id: routine.id || `guest-${routine.day_of_week}-${routine.time_of_day}`,
      routine_name: routine.routine_name,
      description: routine.description,
      status: routine.status || 'active',
      schedule_type: 'weekly' as const,
      schedule_config: {
        days_of_week: [routine.day_of_week]
      },
      time_of_day: routine.time_of_day,
      created_at: routine.created_at || new Date().toISOString(),
      updated_at: routine.updated_at || new Date().toISOString(),
      routine_items: routine.items || []
    }));
  };

  // Update progress when routines change
  useEffect(() => {
    const processedRoutines = isGuest ? transformGuestRoutines(routines) : routines;
    
    console.log('🔄 WeeklyRoutineProgress: Received routines:', {
      count: processedRoutines.length,
      isGuest,
      routines: processedRoutines.map(r => ({
        name: r.routine_name,
        day: r.schedule_config?.days_of_week?.[0],
        timeOfDay: r.time_of_day,
        itemsCount: r.routine_items?.length || 0,
        items: r.routine_items?.map((item: any) => item.item_name) || []
      }))
    });
    
    const newProgress = calculateWeeklyRoutineProgress(processedRoutines);
    console.log('📊 WeeklyRoutineProgress: Calculated progress:', {
      totalSlotsFilled: newProgress.totalSlotsFilled,
      isComplete: newProgress.isComplete,
      days: newProgress.days.map(d => ({
        day: d.dayName,
        morning: { exists: d.morning.exists, hasItems: d.morning.hasItems, itemCount: d.morning.itemCount },
        midday: { exists: d.midday.exists, hasItems: d.midday.hasItems, itemCount: d.midday.itemCount },
        night: { exists: d.night.exists, hasItems: d.night.hasItems, itemCount: d.night.itemCount },
        workout: { exists: d.workout.exists, hasItems: d.workout.hasItems, itemCount: d.workout.itemCount }
      }))
    });
    
    setProgress(newProgress);
  }, [routines, isGuest]);

  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'midday':
        return <Utensils className="h-4 w-4 text-orange-500" />;
      case 'night':
        return <Moon className="h-4 w-4 text-blue-500" />;
      case 'workout':
        return <Dumbbell className="h-4 w-4 text-green-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeOfDayLabel = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning':
        return 'Morning';
      case 'midday':
        return 'Midday';
      case 'night':
        return 'Night';
      case 'workout':
        return 'Workout';
      default:
        return 'Unknown';
    }
  };

  const getSlotStatusColor = (status: 'complete' | 'empty' | 'missing', isRequired: boolean) => {
    if (status === 'complete') return 'border-green-200 bg-green-50';
    if (status === 'empty') return 'border-orange-200 bg-orange-50'; // Changed from yellow to orange for better distinction
    if (isRequired && status === 'missing') return 'border-red-200 bg-red-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getSlotStatusIcon = (status: 'complete' | 'empty' | 'missing', isRequired: boolean) => {
    if (status === 'complete') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'empty') return <Circle className="h-4 w-4 text-orange-600" />; // Changed from yellow to orange
    if (isRequired && status === 'missing') return <Circle className="h-4 w-4 text-red-600" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const renderRoutineCard = (dayStatus: DayRoutineStatus, timeSlot: 'morning' | 'midday' | 'night' | 'workout') => {
    const slotStatus = getRoutineSlotStatus(dayStatus, timeSlot);
    const routine = dayStatus[timeSlot].routine;
    const items = routine?.routine_items || [];
    
    // Debug logging for routine items
    if (items.length > 0) {
      console.log(`🎯 WeeklyRoutineProgress: ${dayStatus.dayName} ${timeSlot} has ${items.length} items:`, items.map(i => i.item_name));
    }

    return (
      <Card 
        key={timeSlot}
        className={`transition-all ${getSlotStatusColor(slotStatus.status, slotStatus.isRequired)}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {getTimeOfDayIcon(timeSlot)}
            <CardTitle className="text-sm font-medium">
              {getTimeOfDayLabel(timeSlot)}
            </CardTitle>
            {slotStatus.isRequired && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getSlotStatusIcon(slotStatus.status, slotStatus.isRequired)}
            {slotStatus.itemCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {slotStatus.itemCount} item{slotStatus.itemCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {items.length > 0 && (
            <div className="space-y-1">
              {items.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {item.item_name}
                  {item.duration_minutes && ` (${item.duration_minutes}min)`}
                  {item.sets && item.reps && ` • ${item.sets}×${item.reps}`}
                </div>
              ))}
              {items.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{items.length - 3} more...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="space-y-4">
      {/* Weekly Tabs with Header */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">My</CardTitle>
              <Badge variant="default" className="text-sm font-medium">
                {activeTab}
              </Badge>
              <CardTitle className="text-lg">Routine</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Add your routines for each day of the week by chatting with your Onboarding Agent
            </p>
          </div>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-2">
            <TabsList className="grid w-full grid-cols-7">
              {DAY_NAMES.map((dayName, index) => {
                const dayStatus = progress.days.find(d => d.dayName === dayName);
                return (
                  <TabsTrigger 
                    key={dayName} 
                    value={dayName}
                    className="flex items-center justify-center space-x-1 text-xs w-full"
                  >
                    {dayStatus?.isComplete ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-400" />
                    )}
                    <span>{DAY_ABBREVIATIONS[index]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>

          <CardContent>
            {DAY_NAMES.map(dayName => {
              const dayStatus = progress.days.find(d => d.dayName === dayName);
              if (!dayStatus) return null;
              
              return (
                <TabsContent key={dayName} value={dayName}>
                  <div className="grid grid-cols-1 gap-4">
                    {(['morning', 'midday', 'night', 'workout'] as const).map(timeSlot => 
                      renderRoutineCard(dayStatus, timeSlot)
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

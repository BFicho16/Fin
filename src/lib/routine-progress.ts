export interface Routine {
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

export interface RoutineItem {
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

export interface DayRoutineStatus {
  day: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  morning: { exists: boolean; hasItems: boolean; itemCount: number; routine?: Routine };
  midday: { exists: boolean; hasItems: boolean; itemCount: number; routine?: Routine };
  night: { exists: boolean; hasItems: boolean; itemCount: number; routine?: Routine };
  workout: { exists: boolean; hasItems: boolean; itemCount: number; routine?: Routine };
  isComplete: boolean; // morning AND night have items
}

export interface WeeklyRoutineProgress {
  days: DayRoutineStatus[];
  totalSlotsFilled: number;
  totalSlotsRequired: number;
  isComplete: boolean;
  completeDays: number;
  missingRequirements: string[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function calculateWeeklyRoutineProgress(routines: Routine[]): WeeklyRoutineProgress {
  const activeRoutines = routines.filter(r => r.status === 'active');
  const days: DayRoutineStatus[] = [];
  let totalSlotsFilled = 0;
  let completeDays = 0;
  const missingRequirements: string[] = [];

  // Initialize each day of the week
  for (let day = 0; day < 7; day++) {
    const dayName = DAY_NAMES[day];
    
    // Find routines for this day
    const dayRoutines = activeRoutines.filter(r => 
      r.schedule_config?.days_of_week?.includes(day)
    );

    // Get routines for each time slot
    const morningRoutine = dayRoutines.find(r => r.time_of_day === 'morning');
    const middayRoutine = dayRoutines.find(r => r.time_of_day === 'midday');
    const nightRoutine = dayRoutines.find(r => r.time_of_day === 'night');
    const workoutRoutine = dayRoutines.find(r => r.time_of_day === 'workout');

    // Calculate status for each time slot
    const morning = {
      exists: !!morningRoutine,
      hasItems: !!(morningRoutine?.routine_items?.length),
      itemCount: morningRoutine?.routine_items?.length || 0,
      routine: morningRoutine
    };

    const midday = {
      exists: !!middayRoutine,
      hasItems: !!(middayRoutine?.routine_items?.length),
      itemCount: middayRoutine?.routine_items?.length || 0,
      routine: middayRoutine
    };

    const night = {
      exists: !!nightRoutine,
      hasItems: !!(nightRoutine?.routine_items?.length),
      itemCount: nightRoutine?.routine_items?.length || 0,
      routine: nightRoutine
    };

    const workout = {
      exists: !!workoutRoutine,
      hasItems: !!(workoutRoutine?.routine_items?.length),
      itemCount: workoutRoutine?.routine_items?.length || 0,
      routine: workoutRoutine
    };

    // Day is complete if both morning and night have items
    const isComplete = morning.hasItems && night.hasItems;

    if (isComplete) {
      completeDays++;
    } else {
      if (!morning.hasItems) {
        missingRequirements.push(`${dayName} morning routine needs at least 1 item`);
      }
      if (!night.hasItems) {
        missingRequirements.push(`${dayName} night routine needs at least 1 item`);
      }
    }

    // Count filled slots (any routine with items)
    if (morning.hasItems) totalSlotsFilled++;
    if (midday.hasItems) totalSlotsFilled++;
    if (night.hasItems) totalSlotsFilled++;
    if (workout.hasItems) totalSlotsFilled++;

    days.push({
      day,
      dayName,
      morning,
      midday,
      night,
      workout,
      isComplete
    });
  }

  // Calculate overall completion
  const totalSlotsRequired = 14; // 7 days × 2 required slots (morning + night)
  const isComplete = completeDays === 7; // All 7 days must be complete

  return {
    days,
    totalSlotsFilled,
    totalSlotsRequired,
    isComplete,
    completeDays,
    missingRequirements
  };
}

export function getDayProgressSummary(progress: WeeklyRoutineProgress): string {
  const { completeDays, totalSlotsFilled, isComplete } = progress;
  
  if (isComplete) {
    return `Complete! All 7 days have morning and night routines (${totalSlotsFilled} total items)`;
  }
  
  return `${completeDays}/7 days complete, ${totalSlotsFilled} routine items filled`;
}

export function getRoutineSlotStatus(
  dayStatus: DayRoutineStatus, 
  timeSlot: 'morning' | 'midday' | 'night' | 'workout'
): {
  isRequired: boolean;
  isComplete: boolean;
  isEmpty: boolean;
  itemCount: number;
  status: 'complete' | 'empty' | 'missing';
} {
  const slot = dayStatus[timeSlot];
  const isRequired = timeSlot === 'morning' || timeSlot === 'night';
  const isComplete = slot.hasItems;
  const isEmpty = slot.exists && !slot.hasItems;
  
  let status: 'complete' | 'empty' | 'missing';
  if (isComplete) {
    status = 'complete';
  } else if (isEmpty) {
    status = 'empty';
  } else {
    status = 'missing';
  }

  return {
    isRequired,
    isComplete,
    isEmpty,
    itemCount: slot.itemCount,
    status
  };
}

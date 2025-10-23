import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { calculateWeeklyRoutineProgress, WeeklyRoutineProgress } from '@/lib/routineProgress';

export const checkOnboardingProgressTool = createTool({
  id: 'check-onboarding-progress',
  description: 'Check which routine slots are filled and what is still needed for onboarding completion',
  inputSchema: z.object({}),
  outputSchema: z.object({
    progress: z.object({
      days: z.array(z.any()),
      totalSlotsFilled: z.number(),
      isComplete: z.boolean(),
      missingRequirements: z.array(z.string()),
    }),
    summary: z.string(),
    nextSteps: z.array(z.string()),
  }),
  execute: async ({ runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }

    const supabase = await createClient();
    
    // Fetch user routines with items
    const { data: routines, error } = await supabase
      .from('user_routines')
      .select(`
        *,
        routine_items (
          id,
          item_name,
          item_type,
          duration_minutes,
          sets,
          reps,
          weight_kg,
          distance_km,
          calories,
          serving_size,
          notes,
          item_order,
          is_optional,
          habit_classification
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch routines: ${error.message}`);
    }

    // Calculate progress
    const progress = calculateWeeklyRoutineProgress(routines || []);
    
    // Generate summary
    const summary = progress.isComplete 
      ? `Onboarding complete! All 7 days have morning and night routines (${progress.totalSlotsFilled} total items)`
      : `${progress.completeDays}/7 days complete, ${progress.totalSlotsFilled} routine items filled. Missing: ${progress.missingRequirements.length} requirements`;

    // Generate next steps
    const nextSteps: string[] = [];
    
    if (!progress.isComplete) {
      if (progress.missingRequirements.length > 0) {
        nextSteps.push('Focus on completing missing requirements:');
        progress.missingRequirements.slice(0, 3).forEach(req => {
          nextSteps.push(`- ${req}`);
        });
        if (progress.missingRequirements.length > 3) {
          nextSteps.push(`- And ${progress.missingRequirements.length - 3} more...`);
        }
      }
      
      // Suggest systematic approach
      const incompleteDays = progress.days.filter(d => !d.isComplete);
      if (incompleteDays.length > 0) {
        nextSteps.push(`Work through ${incompleteDays.length} incomplete days: ${incompleteDays.map(d => d.dayName).join(', ')}`);
      }
      
      nextSteps.push('Ask user about their daily routines for each incomplete day');
      nextSteps.push('Create routines with at least 1 morning and 1 night item per day');
    } else {
      nextSteps.push('Onboarding is complete! User can proceed to main dashboard');
    }

    return {
      progress: {
        days: progress.days,
        totalSlotsFilled: progress.totalSlotsFilled,
        isComplete: progress.isComplete,
        missingRequirements: progress.missingRequirements,
      },
      summary,
      nextSteps,
    };
  },
});

export const createWeeklyRoutineStructureTool = createTool({
  id: 'create-weekly-routine-structure',
  description: 'Create the basic 28-slot weekly routine structure (7 days × 4 time slots) for onboarding',
  inputSchema: z.object({
    userId: z.string().describe('User ID to create routines for'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    routinesCreated: z.number(),
    routineIds: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { userId } = context;
    const supabase = await createClient();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
      { time: 'morning', label: 'Morning' },
      { time: 'midday', label: 'Midday' },
      { time: 'night', label: 'Night' },
      { time: 'workout', label: 'Workout' }
    ];
    
    const routinesToCreate = [];
    const routineIds: string[] = [];
    
    // Create routines for each day and time slot
    for (let day = 0; day < 7; day++) {
      for (const timeSlot of timeSlots) {
        routinesToCreate.push({
          user_id: userId,
          routine_name: `${dayNames[day]} ${timeSlot.label}`,
          description: `Routine for ${dayNames[day]} ${timeSlot.label.toLowerCase()}`,
          status: 'active',
          schedule_type: 'weekly',
          schedule_config: { days_of_week: [day] },
          time_of_day: timeSlot.time,
        });
      }
    }
    
    // Insert all routines
    const { data, error } = await supabase
      .from('user_routines')
      .insert(routinesToCreate)
      .select('id');
    
    if (error) {
      throw new Error(`Failed to create weekly routine structure: ${error.message}`);
    }
    
    data.forEach(routine => routineIds.push(routine.id));
    
    return {
      success: true,
      message: `Created ${data.length} routine slots for weekly structure`,
      routinesCreated: data.length,
      routineIds,
    };
  },
});

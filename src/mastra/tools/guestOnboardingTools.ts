import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ===== READ ALL GUEST DATA =====
export const getGuestDataTool = createTool({
  id: 'get-guest-data',
  description: 'Get all onboarding data for guest session',
  inputSchema: z.object({}),
  outputSchema: z.object({
    profile: z.any(),
    healthMetrics: z.array(z.any()),
    dietaryPreferences: z.any(),
    routines: z.array(z.any()),
  }),
  execute: async ({ runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    if (!guestSessionId) throw new Error('No guest session ID');
    
    const supabase = await createClient();
    const { data } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    return {
      profile: data?.profile || {},
      healthMetrics: data?.health_metrics || [],
      dietaryPreferences: data?.dietary_preferences || {},
      routines: data?.routines || [],
    };
  },
});

// ===== CONSOLIDATED UPDATE TOOL =====
export const updateGuestDataTool = createTool({
  id: 'update-guest-data',
  description: 'Update guest onboarding data (profile, health metrics, dietary preferences, or routines)',
  inputSchema: z.object({
    profile: z.object({
      birth_date: z.string().optional(),
      gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    }).optional(),
    health_metrics: z.array(z.object({
      metric_type: z.enum(['weight', 'height', 'body_fat_percentage', 'bmi']),
      value: z.number(),
      unit: z.string(),
    })).optional(),
    dietary_preferences: z.object({
      dietary_style: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      intolerances: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      preferred_foods: z.array(z.string()).optional(),
      disliked_foods: z.array(z.string()).optional(),
    }).optional(),
    routines: z.array(z.object({
      routine_name: z.string(),
      description: z.string().optional(),
      day_of_week: z.number().min(0).max(6),
      time_of_day: z.string(),
      status: z.string().default('active'),
      items: z.array(z.object({
        item_name: z.string(),
        item_type: z.enum(['exercise', 'food', 'supplement', 'activity', 'rest', 'other']),
        habit_classification: z.enum(['good', 'bad', 'neutral']).default('neutral'),
        duration_minutes: z.number().optional(),
        sets: z.number().optional(),
        reps: z.number().optional(),
        weight_kg: z.number().optional(),
        distance_km: z.number().optional(),
        calories: z.number().optional(),
        serving_size: z.string().optional(),
        notes: z.string().optional(),
        item_order: z.number().default(1),
        is_optional: z.boolean().default(false),
      })).optional(),
    })).optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    if (!guestSessionId) {
      throw new Error('No guest session ID found in runtime context');
    }
    const supabase = await createClient();
    
    // Get current session data
    const { data: session } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    // Merge updates
    const updates: any = { last_accessed: new Date().toISOString() };
    
    if (context.profile) {
      updates.profile = { ...(session?.profile || {}), ...context.profile };
    }
    if (context.health_metrics) {
      const existing = session?.health_metrics || [];
      updates.health_metrics = [...existing, ...context.health_metrics.map(m => ({
        ...m,
        logged_at: new Date().toISOString()
      }))];
    }
    if (context.dietary_preferences) {
      updates.dietary_preferences = { 
        ...(session?.dietary_preferences || {}), 
        ...context.dietary_preferences 
      };
    }
    if (context.routines) {
      const existing = session?.routines || [];
      const updatedRoutines = [...existing];
      
      for (const newRoutine of context.routines) {
        // Find existing routine for same day and time
        const existingIndex = updatedRoutines.findIndex(existing => 
          existing.day_of_week === newRoutine.day_of_week && 
          existing.time_of_day === newRoutine.time_of_day
        );
        
        if (existingIndex >= 0) {
          // Add items to existing routine
          const existingRoutine = updatedRoutines[existingIndex];
          const existingItems = existingRoutine.items || [];
          const newItems = newRoutine.items || [];
          
          // Combine items, avoiding duplicates
          const combinedItems = [...existingItems];
          for (const newItem of newItems) {
            const itemExists = combinedItems.some(existingItem => 
              existingItem.item_name === newItem.item_name
            );
            if (!itemExists) {
              combinedItems.push(newItem);
            }
          }
          
          updatedRoutines[existingIndex] = {
            ...existingRoutine,
            items: combinedItems
          };
        } else {
          // This shouldn't happen with pre-populated routines, but handle gracefully
          console.warn('No existing routine found for day', newRoutine.day_of_week, 'time', newRoutine.time_of_day);
        }
      }
      
      updates.routines = updatedRoutines;
    }
    
    // Write back
    console.log('updateGuestDataTool: Updating session', guestSessionId, 'with data:', updates);
    const { error } = await supabase
      .from('guest_onboarding_sessions')
      .update(updates)
      .eq('session_id', guestSessionId);
    
    if (error) {
      console.error('updateGuestDataTool: Database error:', error);
      throw new Error(`Failed to update guest session: ${error.message}`);
    }
    
    console.log('updateGuestDataTool: Successfully updated session', guestSessionId);
    return { success: true, updates };
  },
});


// ===== DELETE ROUTINE ITEM =====
export const deleteGuestRoutineItemTool = createTool({
  id: 'delete-guest-routine-item',
  description: 'Remove a specific routine item from a guest session routine',
  inputSchema: z.object({
    routine_name: z.string().describe('Name of the routine containing the item'),
    day_of_week: z.number().min(0).max(6).describe('Day of week (0=Sunday, 1=Monday, etc.)'),
    time_of_day: z.string().describe('Time of day (morning, midday, night, workout)'),
    item_name: z.string().describe('Name of the routine item to delete'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    if (!guestSessionId) {
      throw new Error('No guest session ID found in runtime context');
    }
    const supabase = await createClient();
    
    // Get current session data
    const { data: session } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    if (!session) {
      throw new Error('Guest session not found');
    }
    
    const { routine_name, day_of_week, time_of_day, item_name } = context;
    
    // Find the routine to update
    const routines = session.routines || [];
    const routineIndex = routines.findIndex((r: any) => 
      r.routine_name === routine_name && 
      r.day_of_week === day_of_week && 
      r.time_of_day === time_of_day
    );
    
    if (routineIndex === -1) {
      throw new Error(`Routine not found: ${routine_name} for ${day_of_week} ${time_of_day}`);
    }
    
    // Remove the item from the routine
    const routine = routines[routineIndex];
    const items = routine.items || [];
    const itemIndex = items.findIndex((item: any) => item.item_name === item_name);
    
    if (itemIndex === -1) {
      throw new Error(`Item not found: ${item_name} in routine ${routine_name}`);
    }
    
    // Remove the item
    items.splice(itemIndex, 1);
    routine.items = items;
    routines[routineIndex] = routine;
    
    // Update the session with modified routines
    const { error } = await supabase
      .from('guest_onboarding_sessions')
      .update({ 
        routines: routines,
        last_accessed: new Date().toISOString()
      })
      .eq('session_id', guestSessionId);
    
    if (error) {
      console.error('deleteGuestRoutineItemTool: Database error:', error);
      throw new Error(`Failed to delete routine item: ${error.message}`);
    }
    
    console.log('deleteGuestRoutineItemTool: Successfully deleted item:', item_name);
    return { 
      success: true, 
      message: `Successfully removed "${item_name}" from ${routine_name} routine` 
    };
  },
});

// ===== PROGRESS TRACKING =====
export const checkGuestOnboardingProgressTool = createTool({
  id: 'check-guest-onboarding-progress',
  description: 'Check onboarding completion status',
  execute: async ({ runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    // Transform routines for progress calculation
    const routines = (data?.routines || []).map((r: any) => ({
      ...r,
      routine_items: r.items || [],
    }));
    
    // Use existing progress calculation
    const { calculateWeeklyRoutineProgress } = await import('@/lib/routineProgress');
    const progress = calculateWeeklyRoutineProgress(routines);
    
    const summary = progress.isComplete 
      ? `Onboarding complete! ${progress.totalSlotsFilled} items created`
      : `${progress.completeDays}/7 days complete, ${progress.totalSlotsFilled} items`;
    
    const nextSteps: string[] = [];
    if (!progress.isComplete) {
      progress.missingRequirements.slice(0, 3).forEach(req => {
        nextSteps.push(req);
      });
    }
    
    return { progress, summary, nextSteps };
  },
});

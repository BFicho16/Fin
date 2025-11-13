import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { ensureSleepRoutineShape, calculateSleepRoutineProgress, normalizeRoutineItems } from '@/lib/sleep-routine';

const sleepRoutineItemSchema = z.object({
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
});

const sleepRoutineSchema = z.object({
  night: z.object({
    bedtime: z.string().optional(),
    pre_bed: z.array(sleepRoutineItemSchema).optional(),
  }).optional(),
  morning: z.object({
    wake_time: z.string().optional(),
  }).optional(),
});

const mergeRoutineItems = (existing: any[] = [], incoming: any[] = []) => {
  const normalizedExisting = normalizeRoutineItems(existing);
  if (!incoming.length) {
    return normalizedExisting;
  }

  const existingMap = new Map<string, any>();
  for (const item of normalizedExisting) {
    existingMap.set(item.item_name.toLowerCase(), { ...item });
  }

  const normalizedIncoming = normalizeRoutineItems(incoming);
  let nextOrder = normalizedExisting.length + 1;

  for (const item of normalizedIncoming) {
    const key = item.item_name.toLowerCase();
    if (existingMap.has(key)) {
      const current = existingMap.get(key)!;
      existingMap.set(key, {
        ...current,
        ...item,
        item_order: current.item_order,
      });
    } else {
      existingMap.set(key, {
        ...item,
        item_order: nextOrder++,
      });
    }
  }

  return Array.from(existingMap.values())
    .sort((a, b) => (a.item_order ?? 0) - (b.item_order ?? 0))
    .map((item, index) => ({
      ...item,
      item_order: index + 1,
    }));
};

// ===== READ ALL GUEST DATA =====
export const getGuestDataTool = createTool({
  id: 'get-guest-data',
  description: 'Get all onboarding data for guest session',
  inputSchema: z.object({}),
  outputSchema: z.object({
    profile: z.any(),
    healthMetrics: z.array(z.any()),
    dietaryPreferences: z.any(),
    sleepRoutine: z.any(),
    email: z.string().nullable(),
  }),
  execute: async ({ runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    if (!guestSessionId) throw new Error('No guest session ID');
    
    const supabase = createClient();
    const { data } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    return {
      profile: data?.profile || {},
      healthMetrics: data?.health_metrics || [],
      dietaryPreferences: data?.dietary_preferences || {},
      sleepRoutine: ensureSleepRoutineShape(data?.sleep_routine),
      email: data?.email ?? null,
    };
  },
});

// ===== CONSOLIDATED UPDATE TOOL =====
export const updateGuestDataTool = createTool({
  id: 'update-guest-data',
  description: 'Update guest onboarding data (profile, health metrics, dietary preferences, or sleep routine)',
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
    sleep_routine: sleepRoutineSchema.optional(),
    email: z.string().email().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    if (!guestSessionId) {
      throw new Error('No guest session ID found in runtime context');
    }
    const supabase = createClient();
    
    const { data: session } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    const updates: any = { last_accessed: new Date().toISOString() };
    
    if (context.profile) {
      updates.profile = { ...(session?.profile || {}), ...context.profile };
    }
    if (context.health_metrics) {
      const existing = session?.health_metrics || [];
      updates.health_metrics = [...existing, ...context.health_metrics.map(m => ({
        ...m,
        logged_at: new Date().toISOString(),
      }))];
    }
    if (context.dietary_preferences) {
      updates.dietary_preferences = {
        ...(session?.dietary_preferences || {}),
        ...context.dietary_preferences,
      };
    }
    if (context.sleep_routine) {
      const existingSleep = ensureSleepRoutineShape(session?.sleep_routine);
      const nextSleep = { ...existingSleep } as any;
      
      if (context.sleep_routine.night) {
        const incomingNight = context.sleep_routine.night;
        const currentNight = existingSleep.night || { pre_bed: [] };
        nextSleep.night = {
          ...currentNight,
          ...incomingNight,
          bedtime: typeof incomingNight.bedtime === 'string' ? incomingNight.bedtime.trim() : currentNight.bedtime,
          pre_bed: incomingNight.pre_bed
            ? mergeRoutineItems(currentNight.pre_bed || [], incomingNight.pre_bed)
            : normalizeRoutineItems(currentNight.pre_bed || []),
        };
      }

      if (context.sleep_routine.morning) {
        const incomingMorning = context.sleep_routine.morning;
        const currentMorning = existingSleep.morning || { wake_time: null };
        nextSleep.morning = {
          ...currentMorning,
          wake_time: typeof incomingMorning.wake_time === 'string'
            ? incomingMorning.wake_time.trim()
            : currentMorning.wake_time,
        };
      }

      updates.sleep_routine = ensureSleepRoutineShape(nextSleep);
    }

    if (context.email) {
      updates.email = context.email.trim();
    }
    
    if (Object.keys(updates).length === 1) {
      return { success: true, updates: {} };
    }
    
    const { error } = await supabase
      .from('guest_onboarding_sessions')
      .update(updates)
      .eq('session_id', guestSessionId);
    
    if (error) {
      console.error('updateGuestDataTool: Database error:', error);
      throw new Error(`Failed to update guest session: ${error.message}`);
    }
    
    return { success: true, updates };
  },
});

// ===== DELETE SLEEP ROUTINE ITEM =====
export const deleteGuestRoutineItemTool = createTool({
  id: 'delete-guest-routine-item',
  description: 'Remove a specific item from the guest sleep routine',
  inputSchema: z.object({
    time_of_day: z.literal('night').describe('Only pre-bed routine items can be removed'),
    item_name: z.string().describe('Exact name of the routine item to delete'),
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
    const supabase = createClient();
    
    const { data: session } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    if (!session) {
      throw new Error('Guest session not found');
    }
    
    const sleepRoutine = ensureSleepRoutineShape(session.sleep_routine);
    const { item_name } = context;
    const items = [...(sleepRoutine.night.pre_bed || [])];
    const index = items.findIndex(item => item.item_name === item_name);
    
    if (index === -1) {
      throw new Error(`Item not found: ${item_name}`);
    }
    
    items.splice(index, 1);
    const updatedSleepRoutine = {
      ...sleepRoutine,
      night: {
        ...sleepRoutine.night,
        pre_bed: items,
      },
    };
    
    const { error } = await supabase
      .from('guest_onboarding_sessions')
      .update({
        sleep_routine: updatedSleepRoutine,
        last_accessed: new Date().toISOString(),
      })
      .eq('session_id', guestSessionId);
    
    if (error) {
      console.error('deleteGuestRoutineItemTool: Database error:', error);
      throw new Error(`Failed to delete routine item: ${error.message}`);
    }
    
    return {
      success: true,
      message: `Removed "${item_name}" from pre-bed routine`,
    };
  },
});

// ===== PROGRESS TRACKING =====
export const checkGuestOnboardingProgressTool = createTool({
  id: 'check-guest-onboarding-progress',
  description: 'Check sleep onboarding completion status',
  execute: async ({ runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    if (!guestSessionId) {
      throw new Error('No guest session ID found in runtime context');
    }
    const supabase = createClient();
    
    const { data } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    const sleepRoutine = ensureSleepRoutineShape(data?.sleep_routine);
    const progress = calculateSleepRoutineProgress(sleepRoutine);

    const summary = progress.isComplete
      ? 'Sleep routine onboarding complete!'
      : `Sleep routine ${progress.missing.length ? 'needs attention' : 'is in progress'}`;

    const nextSteps = progress.missing.slice(0, 3);

    return {
      progress,
      summary,
      nextSteps,
    };
  },
});

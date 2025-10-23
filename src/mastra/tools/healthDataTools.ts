import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

// User Profile Tools
export const getUserProfileTool = createTool({
  id: 'get-user-profile',
  description: 'Retrieve user health profile including demographics and basic info',
  inputSchema: z.object({}),
  outputSchema: z.object({
    profile: z.object({
      id: z.string(),
      email: z.string(),
      birth_date: z.string().nullable(),
      gender: z.string().nullable(),
      activity_level: z.string().nullable(),
      created_at: z.string(),
      updated_at: z.string(),
    }).nullable(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    // Get user ID from runtime context instead of memory
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return { profile: data };
  },
});

export const updateUserProfileTool = createTool({
  id: 'update-user-profile',
  description: 'Update user demographics and health profile information',
  inputSchema: z.object({
    updates: z.object({
      birth_date: z.string().optional(),
      gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
      activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']).optional(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    console.log('updateUserProfileTool called with context:', context);
    console.log('runtimeContext userId:', runtimeContext?.get('userId'));
    
    // Get user ID from runtime context instead of memory
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      console.error('User ID not found in runtime context');
      throw new Error('User ID not found in runtime context');
    }
    const { updates } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    console.log('Updating user profile with:', updates, 'for user:', userId);
    
    // No conversion needed - we only accept birth_date now
    const processedUpdates = { ...updates };
    
    const { error } = await supabase
      .from('user_profiles')
      .update(processedUpdates)
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user profile:', error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    console.log('User profile updated successfully');
    return { 
      success: true, 
      message: 'User profile updated successfully' 
    };
  },
});

// User Goals Tools
export const saveUserGoalsTool = createTool({
  id: 'save-user-goals',
  description: 'Save or update user health and wellness goals',
  inputSchema: z.object({
    goals: z.array(z.object({
      goal_type: z.enum(['weight_loss', 'weight_gain', 'muscle_gain', 'strength', 'endurance', 'longevity', 'general_health', 'sports_performance', 'rehabilitation']),
      goal_description: z.string().optional(),
      target_value: z.number().optional(),
      target_unit: z.string().optional(),
      target_date: z.string().optional(),
      priority: z.number().min(1).max(5).default(1),
      status: z.enum(['active', 'completed', 'paused', 'cancelled']).default('active'),
    })),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    goal_ids: z.array(z.string()),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    // Get user ID from runtime context instead of memory
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { goals } = context;
    
    // Get the authenticated Supabase client from runtime context
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    const goal_ids: string[] = [];
    
    for (const goal of goals) {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          ...goal,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to save goal: ${error.message}`);
      }
      
      goal_ids.push(data.id);
    }

    return { 
      success: true, 
      message: 'Goals saved successfully',
      goal_ids
    };
  },
});

export const getUserGoalsTool = createTool({
  id: 'get-user-goals',
  description: 'Retrieve user health and wellness goals',
  inputSchema: z.object({
  }),
  outputSchema: z.object({
    goals: z.array(z.object({
      id: z.string(),
      goal_type: z.string(),
      goal_description: z.string().nullable(),
      target_value: z.number().nullable(),
      target_unit: z.string().nullable(),
      target_date: z.string().nullable(),
      priority: z.number(),
      status: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    // Get user ID from runtime context instead of memory
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch user goals: ${error.message}`);
    }

    return { goals: data || [] };
  },
});

// Dietary Preferences Tools
export const saveDietaryPreferencesTool = createTool({
  id: 'save-dietary-preferences',
  description: 'Save user dietary preferences, restrictions, and food preferences',
  inputSchema: z.object({
    preferences: z.object({
      dietary_style: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      intolerances: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      preferred_foods: z.array(z.string()).optional(),
      disliked_foods: z.array(z.string()).optional(),
      meal_frequency: z.number().default(3),
      cooking_skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      budget_range: z.enum(['low', 'medium', 'high']).optional(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    // Get user ID from runtime context instead of memory
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { preferences } = context;
    const supabase = await createClient();
    
    // First, check if preferences already exist
    const { data: existing } = await supabase
      .from('user_dietary_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing preferences
      result = await supabase
        .from('user_dietary_preferences')
        .update(preferences)
        .eq('user_id', userId);
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_dietary_preferences')
        .insert({
          user_id: userId,
          ...preferences,
        });
    }

    if (result.error) {
      throw new Error(`Failed to save dietary preferences: ${result.error.message}`);
    }

    return { 
      success: true, 
      message: 'Dietary preferences saved successfully' 
    };
  },
});

// Routine Management Tools
export const createRoutineTool = createTool({
  id: 'create-routine',
  description: 'Create a new routine for the user',
  inputSchema: z.object({
    routine: z.object({
      routine_name: z.string(),
      description: z.string().optional(),
      status: z.enum(['pending', 'active', 'archived']).default('pending'),
      schedule_type: z.enum(['weekly', 'monthly', 'yearly']),
      schedule_config: z.object({
        days_of_week: z.array(z.number().min(0).max(6)).optional(),
        days_of_month: z.array(z.number().min(1).max(31)).optional(),
        days_of_year: z.array(z.string()).optional(),
      }),
      time_of_day: z.enum(['morning', 'midday', 'night', 'workout']).optional(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    routine_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { routine } = context;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_routines')
      .insert({
        user_id: userId,
        ...routine,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create routine: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Routine created successfully',
      routine_id: data.id
    };
  },
});

export const updateRoutineTool = createTool({
  id: 'update-routine',
  description: 'Update routine details and status',
  inputSchema: z.object({
    routineId: z.string().describe('Routine ID'),
    updates: z.object({
      routine_name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['pending', 'active', 'archived']).optional(),
      schedule_type: z.enum(['weekly', 'monthly', 'yearly']).optional(),
      schedule_config: z.object({
        days_of_week: z.array(z.number().min(0).max(6)).optional(),
        days_of_month: z.array(z.number().min(1).max(31)).optional(),
        days_of_year: z.array(z.string()).optional(),
      }).optional(),
      time_of_day: z.enum(['morning', 'midday', 'night', 'workout']).optional(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { routineId, updates } = context;
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_routines')
      .update(updates)
      .eq('id', routineId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update routine: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Routine updated successfully' 
    };
  },
});

export const getUserRoutinesTool = createTool({
  id: 'get-user-routines',
  description: 'Retrieve user routines',
  inputSchema: z.object({
    status: z.string().optional().describe('Filter by routine status'),
  }),
  outputSchema: z.object({
    routines: z.array(z.object({
      id: z.string(),
      routine_name: z.string(),
      description: z.string().nullable(),
      status: z.string(),
      schedule_type: z.string(),
      schedule_config: z.any(),
      time_of_day: z.string().nullable(),
      created_at: z.string(),
      updated_at: z.string(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { status } = context;
    const supabase = await createClient();
    
    let query = supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch routines: ${error.message}`);
    }

    return { routines: data || [] };
  },
});

export const addRoutineItemTool = createTool({
  id: 'add-routine-item',
  description: 'Add an item to a routine',
  inputSchema: z.object({
    routineId: z.string().describe('Routine ID'),
    item: z.object({
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
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    item_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { routineId, item } = context;
    const supabase = await createClient();
    
    // Verify routine ownership
    const { data: routine, error: routineError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (routineError || !routine) {
      throw new Error('Routine not found or access denied');
    }

    const { data, error } = await supabase
      .from('routine_items')
      .insert({
        routine_id: routineId,
        habit_classification: item.habit_classification || 'neutral',
        ...item,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to add routine item: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Routine item added successfully',
      item_id: data.id
    };
  },
});

export const updateRoutineItemTool = createTool({
  id: 'update-routine-item',
  description: 'Update a routine item',
  inputSchema: z.object({
    itemId: z.string().describe('Routine item ID'),
    updates: z.object({
      item_name: z.string().optional(),
      item_type: z.enum(['exercise', 'food', 'supplement', 'activity', 'rest', 'other']).optional(),
      duration_minutes: z.number().optional(),
      sets: z.number().optional(),
      reps: z.number().optional(),
      weight_kg: z.number().optional(),
      distance_km: z.number().optional(),
      calories: z.number().optional(),
      serving_size: z.string().optional(),
      notes: z.string().optional(),
      item_order: z.number().optional(),
      is_optional: z.boolean().optional(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { itemId, updates } = context;
    const supabase = await createClient();
    
    // Verify item ownership through routine
    const { data: item, error: itemError } = await supabase
      .from('routine_items')
      .select(`
        id,
        user_routines!inner (
          user_id
        )
      `)
      .eq('id', itemId)
      .eq('user_routines.user_id', userId)
      .single();

    if (itemError || !item) {
      throw new Error('Routine item not found or access denied');
    }

    const { error } = await supabase
      .from('routine_items')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to update routine item: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Routine item updated successfully' 
    };
  },
});

export const deleteRoutineItemTool = createTool({
  id: 'delete-routine-item',
  description: 'Remove an item from a routine',
  inputSchema: z.object({
    itemId: z.string().describe('Routine item ID'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { itemId } = context;
    const supabase = await createClient();
    
    // Verify item ownership through routine
    const { data: item, error: itemError } = await supabase
      .from('routine_items')
      .select(`
        id,
        user_routines!inner (
          user_id
        )
      `)
      .eq('id', itemId)
      .eq('user_routines.user_id', userId)
      .single();

    if (itemError || !item) {
      throw new Error('Routine item not found or access denied');
    }

    const { error } = await supabase
      .from('routine_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to delete routine item: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Routine item deleted successfully' 
    };
  },
});

export const markRoutineItemCompleteTool = createTool({
  id: 'mark-routine-item-complete',
  description: 'Mark a routine item as completed or skipped',
  inputSchema: z.object({
    itemId: z.string().describe('Routine item ID'),
    completion_date: z.string().optional().describe('Date of completion (YYYY-MM-DD format)'),
    completion_status: z.enum(['completed', 'skipped']).default('completed').describe('Whether item was completed or skipped'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    completion_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { itemId, completion_date, completion_status } = context;
    const supabase = await createClient();
    
    // Verify item ownership through routine
    const { data: item, error: itemError } = await supabase
      .from('routine_items')
      .select(`
        id,
        user_routines!inner (
          user_id
        )
      `)
      .eq('id', itemId)
      .eq('user_routines.user_id', userId)
      .single();

    if (itemError || !item) {
      throw new Error('Routine item not found or access denied');
    }

    const { data, error } = await supabase
      .from('routine_completions')
      .insert({
        routine_item_id: itemId,
        user_id: userId,
        completion_date: completion_date || new Date().toISOString().split('T')[0],
        completion_status: completion_status || 'completed',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to mark item as complete: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Routine item marked as complete',
      completion_id: data.id
    };
  },
});

// User Interactions Tool
export const saveUserInteractionTool = createTool({
  id: 'save-user-interaction',
  description: 'Save user interaction data extracted from conversations',
  inputSchema: z.object({
    interaction: z.object({
      interaction_type: z.enum(['conversation', 'data_extraction', 'plan_feedback', 'goal_update', 'habit_tracking']),
      data_extracted: z.any().optional(), // JSONB structure
      conversation_summary: z.string().optional(),
      key_insights: z.array(z.string()).optional(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    interaction_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    // Get user ID from runtime context instead of memory
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { interaction } = context;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        ...interaction,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save user interaction: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'User interaction saved successfully',
      interaction_id: data.id
    };
  },
});

// Health Metrics Logging Tools
export const logHealthMetricTool = createTool({
  id: 'log-health-metric',
  description: 'Log any health metric (weight, height, body fat, etc.) with timestamp',
  inputSchema: z.object({
    metric_type: z.enum(['weight', 'height', 'body_fat_percentage', 'muscle_mass', 'bmi', 'waist_circumference', 'chest_circumference', 'hip_circumference']),
    value: z.number(),
    unit: z.string(),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    metric_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { metric_type, value, unit, notes } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    const { data, error } = await supabase
      .from('health_metrics_log')
      .insert({
        user_id: userId,
        metric_type,
        value,
        unit,
        notes,
        source: 'manual_entry'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to log health metric: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Health metric logged successfully',
      metric_id: data.id
    };
  },
});

export const getHealthMetricsHistoryTool = createTool({
  id: 'get-health-metrics-history',
  description: 'Retrieve health metrics history with optional filtering',
  inputSchema: z.object({
    metric_type: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.number().default(50),
  }),
  outputSchema: z.object({
    metrics: z.array(z.object({
      id: z.string(),
      metric_type: z.string(),
      value: z.number(),
      unit: z.string(),
      logged_at: z.string(),
      source: z.string(),
      notes: z.string().nullable(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { metric_type, start_date, end_date, limit } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    let query = supabase
      .from('health_metrics_log')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (metric_type) {
      query = query.eq('metric_type', metric_type);
    }
    if (start_date) {
      query = query.gte('logged_at', start_date);
    }
    if (end_date) {
      query = query.lte('logged_at', end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch health metrics: ${error.message}`);
    }

    return { metrics: data || [] };
  },
});

export const getCurrentHealthMetricsTool = createTool({
  id: 'get-current-health-metrics',
  description: 'Get latest value for each metric type',
  inputSchema: z.object({}),
  outputSchema: z.object({
    current_metrics: z.array(z.object({
      metric_type: z.string(),
      value: z.number(),
      unit: z.string(),
      logged_at: z.string(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    // Get the most recent entry for each metric type
    const { data, error } = await supabase
      .from('health_metrics_log')
      .select('metric_type, value, unit, logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch current health metrics: ${error.message}`);
    }

    // Group by metric_type and get the latest for each
    const latestByType = new Map();
    data?.forEach((metric: any) => {
      if (!latestByType.has(metric.metric_type)) {
        latestByType.set(metric.metric_type, metric);
      }
    });

    return { current_metrics: Array.from(latestByType.values()) };
  },
});

// Meal Logging Tools
export const logMealTool = createTool({
  id: 'log-meal',
  description: 'Log meals with nutrition data',
  inputSchema: z.object({
    meal_type: z.enum(['breakfast', 'midday', 'dinner', 'snack']),
    foods: z.array(z.object({
      name: z.string(),
      calories: z.number(),
      amount: z.string(),
    })),
    macros: z.object({
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
      fiber: z.number().optional(),
    }).optional(),
    total_calories: z.number().optional(),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    meal_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { meal_type, foods, macros, total_calories, notes } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        meal_type,
        foods,
        macros,
        total_calories,
        notes
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to log meal: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Meal logged successfully',
      meal_id: data.id
    };
  },
});

export const getMealsHistoryTool = createTool({
  id: 'get-meals-history',
  description: 'Retrieve meal history with date range filtering',
  inputSchema: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.number().default(50),
  }),
  outputSchema: z.object({
    meals: z.array(z.object({
      id: z.string(),
      meal_type: z.string(),
      consumed_at: z.string(),
      total_calories: z.number().nullable(),
      macros: z.any().nullable(),
      foods: z.any().nullable(),
      notes: z.string().nullable(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { start_date, end_date, limit } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    let query = supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('consumed_at', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('consumed_at', start_date);
    }
    if (end_date) {
      query = query.lte('consumed_at', end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch meals: ${error.message}`);
    }

    return { meals: data || [] };
  },
});

// Steps Logging Tools
export const logStepsTool = createTool({
  id: 'log-steps',
  description: 'Log daily steps with distance and calories',
  inputSchema: z.object({
    steps_count: z.number(),
    distance_miles: z.number().optional(),
    calories_burned: z.number().optional(),
    logged_date: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    steps_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { steps_count, distance_miles, calories_burned, logged_date } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    const { data, error } = await supabase
      .from('steps')
      .insert({
        user_id: userId,
        steps_count,
        distance_miles,
        calories_burned,
        logged_date: logged_date || new Date().toISOString().split('T')[0]
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to log steps: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Steps logged successfully',
      steps_id: data.id
    };
  },
});

export const getStepsHistoryTool = createTool({
  id: 'get-steps-history',
  description: 'Retrieve steps history with date range filtering',
  inputSchema: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
  outputSchema: z.object({
    steps: z.array(z.object({
      id: z.string(),
      steps_count: z.number(),
      distance_miles: z.number().nullable(),
      calories_burned: z.number().nullable(),
      logged_date: z.string(),
      source: z.string(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { start_date, end_date } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    let query = supabase
      .from('steps')
      .select('*')
      .eq('user_id', userId)
      .order('logged_date', { ascending: false });

    if (start_date) {
      query = query.gte('logged_date', start_date);
    }
    if (end_date) {
      query = query.lte('logged_date', end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch steps: ${error.message}`);
    }

    return { steps: data || [] };
  },
});

// Exercise Logging Tools
export const logExerciseTool = createTool({
  id: 'log-exercise',
  description: 'Log exercise sessions with type, duration, and intensity',
  inputSchema: z.object({
    exercise_type: z.enum(['cardio', 'strength', 'flexibility', 'sports', 'yoga', 'pilates', 'swimming', 'cycling', 'running', 'walking']),
    exercise_name: z.string(),
    duration_minutes: z.number(),
    intensity_level: z.enum(['low', 'moderate', 'high']).optional(),
    calories_burned: z.number().optional(),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    exercise_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { exercise_type, exercise_name, duration_minutes, intensity_level, calories_burned, notes } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: userId,
        exercise_type,
        exercise_name,
        duration_minutes,
        intensity_level,
        calories_burned,
        notes
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to log exercise: ${error.message}`);
    }

    return { 
      success: true, 
      message: 'Exercise logged successfully',
      exercise_id: data.id
    };
  },
});

export const getExercisesHistoryTool = createTool({
  id: 'get-exercises-history',
  description: 'Retrieve exercise history with filtering by type and date',
  inputSchema: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    exercise_type: z.string().optional(),
    limit: z.number().default(50),
  }),
  outputSchema: z.object({
    exercises: z.array(z.object({
      id: z.string(),
      exercise_type: z.string(),
      exercise_name: z.string(),
      duration_minutes: z.number(),
      intensity_level: z.string().nullable(),
      calories_burned: z.number().nullable(),
      performed_at: z.string(),
      notes: z.string().nullable(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { start_date, end_date, exercise_type, limit } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('performed_at', start_date);
    }
    if (end_date) {
      query = query.lte('performed_at', end_date);
    }
    if (exercise_type) {
      query = query.eq('exercise_type', exercise_type);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    return { exercises: data || [] };
  },
});

// Supplement Logging Tools
export const logSupplementTool = createTool({
  id: 'log-supplement',
  description: 'Log individual supplement intake with dosage',
  inputSchema: z.object({
    supplement_name: z.string(),
    dosage: z.string(),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    supplement_id: z.string(),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { supplement_name, dosage, notes } = context;
    
    const response = await fetch(`/api/supplements/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supplement_name,
        dosage,
        notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to log supplement: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    return { 
      success: true, 
      message: 'Supplement logged successfully',
      supplement_id: result.supplement_id
    };
  },
});

export const getSupplementsHistoryTool = createTool({
  id: 'get-supplements-history',
  description: 'Retrieve supplement history with date range filtering',
  inputSchema: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.number().default(50),
  }),
  outputSchema: z.object({
    supplements: z.array(z.object({
      id: z.string(),
      supplement_name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      taken_at: z.string(),
      notes: z.string().nullable(),
    })),
  }),
  execute: async ({ context, memory, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    const { start_date, end_date, limit } = context;
    const supabase = runtimeContext?.get('supabase') || await createClient();
    
    let query = supabase
      .from('supplements')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('taken_at', start_date);
    }
    if (end_date) {
      query = query.lte('taken_at', end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch supplements: ${error.message}`);
    }

    return { supplements: data || [] };
  },
});

import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { calculateWeeklyRoutineProgress } from '@/lib/routineProgress';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    console.log('🔍 Guest Progress API: Request received for sessionId:', sessionId);
    
    if (!sessionId) {
      console.log('❌ Guest Progress API: Missing sessionId');
      return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    
    console.log('🔍 Guest Progress API: Creating Supabase client...');
    let supabase;
    try {
      supabase = await createServerClient();
      console.log('✅ Guest Progress API: Server client created successfully');
    } catch (serverError) {
      console.warn('⚠️ Guest Progress API: Server client failed, falling back to browser client:', serverError);
      supabase = createBrowserClient();
      console.log('✅ Guest Progress API: Browser client created successfully');
    }
    console.log('🔍 Guest Progress API: Querying database for session:', sessionId);
    
    const { data: session, error: queryError } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (queryError) {
      console.error('❌ Guest Progress API: Database query error:', queryError);
      return Response.json({ error: 'Database query failed' }, { status: 500 });
    }
    
    if (!session) {
      console.log('ℹ️ Guest Progress API: Session not found, returning empty progress for new session:', sessionId);
      // Return empty progress for new sessions
      return Response.json({
        profile: null,
        healthMetrics: [],
        dietaryPreferences: {},
        routines: [],
        progress: {
          hasProfile: false,
          hasHealthMetrics: false,
          routinesComplete: false,
          routineProgress: {
            isComplete: false,
            totalSlotsFilled: 0,
            days: Array(7).fill({ morning: [], night: [], workout: [], midday: [] })
          },
          isComplete: false,
        },
      });
    }
    
    console.log('✅ Guest Progress API: Session found:', {
      sessionId: session.session_id,
      hasProfile: !!session.profile,
      hasHealthMetrics: !!session.health_metrics,
      hasRoutines: !!session.routines,
      routinesCount: session.routines?.length || 0
    });
    
    // Calculate progress from JSON
    const hasProfile = session?.profile?.birth_date && session?.profile?.gender;
    const hasWeight = session?.health_metrics?.some((m: any) => m.metric_type === 'weight');
    const hasHeight = session?.health_metrics?.some((m: any) => m.metric_type === 'height');
    
    const routines = (session?.routines || []).map((r: any) => ({
      ...r,
      routine_items: r.items || [],
      // Transform guest routine structure to match expected format
      schedule_config: {
        days_of_week: [r.day_of_week]
      },
      schedule_type: 'weekly',
      status: 'active', // Guest routines are always active
      id: r.temp_routine_id || `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    const routineProgress = calculateWeeklyRoutineProgress(routines);
    
    // Debug logging for routine transformation
    console.log('🔄 Guest Progress API: Transformed routines:', {
      originalCount: session?.routines?.length || 0,
      transformedCount: routines.length,
      totalItems: routines.reduce((total, r) => total + (r.routine_items?.length || 0), 0),
      progressComplete: routineProgress.isComplete,
      totalSlotsFilled: routineProgress.totalSlotsFilled
    });
    
    // Debug logging for individual routine items
    routines.forEach((routine, index) => {
      console.log(`🔍 Routine ${index}:`, {
        name: routine.routine_name,
        day: routine.day_of_week,
        timeOfDay: routine.time_of_day,
        itemsCount: routine.routine_items?.length || 0,
        items: routine.routine_items?.map((item: any) => item.item_name) || []
      });
    });
    
    return Response.json({
      profile: session?.profile,
      healthMetrics: session?.health_metrics,
      dietaryPreferences: session?.dietary_preferences,
      routines: routines, // Return transformed routines, not original
      progress: {
        hasProfile,
        hasHealthMetrics: hasWeight && hasHeight,
        routinesComplete: routineProgress.isComplete,
        routineProgress,
        isComplete: hasProfile && hasWeight && hasHeight && routineProgress.isComplete,
      },
    });
  } catch (error) {
    console.error('Error fetching guest progress:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

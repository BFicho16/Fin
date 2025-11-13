import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureSleepRoutineShape, calculateSleepRoutineProgress } from '@/lib/sleep-routine';

export async function GET(request: NextRequest) {
  console.log('🚀 Guest Progress API: Starting request');
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    console.log('🔍 Guest Progress API: Request details:', {
      url: request.url,
      sessionId,
      searchParams: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString()
    });
    
    if (!sessionId) {
      console.log('❌ Guest Progress API: Missing sessionId');
      return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    
    console.log('🔍 Guest Progress API: Creating Supabase client...');
    const supabase = await createClient();
    console.log('✅ Guest Progress API: Supabase client created successfully');
    console.log('🔍 Guest Progress API: About to query database for session:', sessionId);
    
    const { data: session, error: queryError } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    console.log('📊 Guest Progress API: Database query completed:', {
      hasData: !!session,
      hasError: !!queryError,
      errorMessage: queryError?.message,
      sessionId: session?.session_id,
      timestamp: new Date().toISOString()
    });
    
    if (queryError) {
      console.error('❌ Guest Progress API: Database query error:', {
        error: queryError,
        message: queryError.message,
        details: queryError.details,
        hint: queryError.hint,
        code: queryError.code
      });
      return Response.json({ error: 'Database query failed' }, { status: 500 });
    }
    
    if (!session) {
      console.log('ℹ️ Guest Progress API: Session not found, returning empty progress for new session:', sessionId);
      const emptyResponse = {
        profile: null,
        healthMetrics: [],
        dietaryPreferences: {},
        sleepRoutine: ensureSleepRoutineShape(),
        email: null,
        progress: {
          hasProfile: false,
          hasHealthMetrics: false,
          sleepRoutineComplete: false,
          sleepProgress: calculateSleepRoutineProgress(ensureSleepRoutineShape()),
          isComplete: false,
        },
      };
      console.log('📤 Guest Progress API: Returning empty response for new session');
      return Response.json(emptyResponse);
    }
    
    console.log('✅ Guest Progress API: Session found:', {
      sessionId: session.session_id,
      hasProfile: !!session.profile,
      hasHealthMetrics: !!session.health_metrics,
      hasSleepRoutine: !!session.sleep_routine,
    });
    
    const hasProfile = session?.profile?.birth_date && session?.profile?.gender;
    const hasWeight = session?.health_metrics?.some((m: any) => m.metric_type === 'weight');
    const hasHeight = session?.health_metrics?.some((m: any) => m.metric_type === 'height');

    const sleepRoutine = ensureSleepRoutineShape(session?.sleep_routine);
    const sleepProgress = calculateSleepRoutineProgress(sleepRoutine);

    console.log('🔄 Guest Progress API: Sleep progress snapshot:', {
      hasBedtime: sleepProgress.hasBedtime,
      hasWakeTime: sleepProgress.hasWakeTime,
      preBedCount: sleepProgress.preBedCount,
      isComplete: sleepProgress.isComplete,
    });

    const response = {
      profile: session?.profile,
      healthMetrics: session?.health_metrics,
      dietaryPreferences: session?.dietary_preferences,
      sleepRoutine,
      email: session?.email ?? null,
      progress: {
        hasProfile,
        hasHealthMetrics: hasWeight && hasHeight,
        sleepRoutineComplete: sleepProgress.isComplete,
        sleepProgress,
        isComplete: sleepProgress.isComplete,
      },
    };
    
    console.log('📤 Guest Progress API: Returning response:', {
      hasProfile: !!response.profile,
      healthMetricsCount: response.healthMetrics?.length || 0,
      bedtime: response.sleepRoutine.night?.bedtime,
      wakeTime: response.sleepRoutine.morning?.wake_time,
      preBedCount: response.sleepRoutine.night?.pre_bed?.length || 0,
      progressComplete: response.progress.isComplete,
      timestamp: new Date().toISOString()
    });
    
    try {
      const jsonResponse = Response.json(response);
      console.log('✅ Guest Progress API: Response created successfully');
      return jsonResponse;
    } catch (jsonError) {
      console.error('❌ Guest Progress API: JSON serialization error:', jsonError);
      return Response.json({ error: 'Response serialization failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('💥 Guest Progress API: Unexpected error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

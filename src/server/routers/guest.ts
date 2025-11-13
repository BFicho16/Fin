import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { createClient } from '@/lib/supabase/server';
import { ensureSleepRoutineShape, calculateSleepRoutineProgress } from '@/lib/sleep-routine';

export const guestRouter = router({
  getProgress: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const supabase = await createClient();
      
      const { data: session, error } = await supabase
        .from('guest_onboarding_sessions')
        .select('*')
        .eq('session_id', input.sessionId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch session: ${error.message}`);
      }

      if (!session) {
        return {
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
      }

      const hasProfile = session?.profile?.birth_date && session?.profile?.gender;
      const hasWeight = session?.health_metrics?.some((m: any) => m.metric_type === 'weight');
      const hasHeight = session?.health_metrics?.some((m: any) => m.metric_type === 'height');

      const sleepRoutine = ensureSleepRoutineShape(session?.sleep_routine);
      const sleepProgress = calculateSleepRoutineProgress(sleepRoutine);

      return {
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
    }),
});


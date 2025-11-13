import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { createClient } from '@/lib/supabase/server';

export const routineRouter = router({
  getActiveRoutine: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const supabase = await createClient();
      
      // Verify the user is authenticated and matches the userId
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      if (user.id !== input.userId) {
        throw new Error('Forbidden');
      }

      const { data: routine, error } = await supabase
        .from('user_routines')
        .select('id, content, version, created_at')
        .eq('user_id', input.userId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single();

      if (error) {
        // If no rows found, return null (not an error)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch routine: ${error.message}`);
      }

      return routine;
    }),

  createRoutine: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        content: z.string().min(1, 'Content cannot be empty'),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      
      // Verify the user is authenticated and matches the userId
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      if (user.id !== input.userId) {
        throw new Error('Forbidden');
      }

      // Start a transaction-like operation:
      // 1. Deactivate previous active routine
      // 2. Get next version number
      // 3. Create new routine

      // Mark previous active routine as past
      await supabase
        .from('user_routines')
        .update({ status: 'past' })
        .eq('user_id', input.userId)
        .eq('status', 'active')
        .is('deleted_at', null);

      // Get the next version number
      const { data: maxVersion, error: maxError } = await supabase
        .from('user_routines')
        .select('version')
        .eq('user_id', input.userId)
        .is('deleted_at', null)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = maxVersion ? maxVersion.version + 1 : 1;

      // Create new routine
      const { data: newRoutine, error: createError } = await supabase
        .from('user_routines')
        .insert({
          user_id: input.userId,
          content: input.content,
          version: nextVersion,
          status: 'active',
        })
        .select('id, content, version, created_at')
        .single();

      if (createError) {
        throw new Error(`Failed to create routine: ${createError.message}`);
      }

      return newRoutine;
    }),

  getRoutineHistory: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(100).optional().default(20),
      })
    )
    .query(async ({ input }) => {
      const supabase = await createClient();
      
      // Verify the user is authenticated and matches the userId
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      if (user.id !== input.userId) {
        throw new Error('Forbidden');
      }

      const { data: routines, error } = await supabase
        .from('user_routines')
        .select('id, content, version, created_at, status')
        .eq('user_id', input.userId)
        .is('deleted_at', null)
        .order('version', { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new Error(`Failed to fetch routine history: ${error.message}`);
      }

      return routines || [];
    }),
});


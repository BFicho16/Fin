import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { ensureSleepRoutineShape, type SleepRoutine } from '@/lib/sleep-routine';

/**
 * Formats sleep routine data into a natural conversational message
 */
function formatSleepRoutineMessage(sleepRoutine: SleepRoutine): string {
  const { night, morning } = sleepRoutine;
  const bedtime = night?.bedtime;
  const wakeTime = morning?.wake_time;
  const preBedActivities = night?.pre_bed || [];

  // Build the message parts - start with instruction to create draft routine
  const parts: string[] = ['Please create a draft routine with these items:'];

  // Add bedtime and wake time if available
  if (bedtime && wakeTime) {
    parts.push(`Bedtime: ${bedtime}, Wake time: ${wakeTime}`);
  } else if (bedtime) {
    parts.push(`Bedtime: ${bedtime}`);
  } else if (wakeTime) {
    parts.push(`Wake time: ${wakeTime}`);
  }

  // Add pre-bed activities if available
  if (preBedActivities.length > 0) {
    const activityNames = preBedActivities.map((item) => item.item_name);
    let activityText = '';
    
    if (activityNames.length === 1) {
      activityText = activityNames[0];
    } else if (activityNames.length === 2) {
      activityText = `${activityNames[0]} and ${activityNames[1]}`;
    } else {
      const lastActivity = activityNames[activityNames.length - 1];
      const otherActivities = activityNames.slice(0, -1);
      activityText = `${otherActivities.join(', ')}, and ${lastActivity}`;
    }
    
    parts.push(`Pre-bed activities: ${activityText}`);
  }

  return parts.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const { email, guestSessionId } = await request.json();

    if (!email || !guestSessionId) {
      return Response.json(
        { error: 'Email and guestSessionId are required' },
        { status: 400 }
      );
    }

    // Step 1: Create account and get session
    const createAccountResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/create-and-signin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, guestSessionId }),
      }
    );

    if (!createAccountResponse.ok) {
      const errorData = await createAccountResponse.json();
      return Response.json(
        { error: 'Failed to create account', details: errorData.error },
        { status: createAccountResponse.status }
      );
    }

    const { userId, session } = await createAccountResponse.json();

    // Step 2: Fetch guest session sleep routine data
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();

    // Fetch guest session data
    const { data: guestSession } = await adminClient
      .from('guest_onboarding_sessions')
      .select('sleep_routine')
      .eq('session_id', guestSessionId)
      .single();

    // Extract and normalize sleep routine data
    // If session not found, use empty sleep routine (will result in default message)
    const sleepRoutine = ensureSleepRoutineShape(guestSession?.sleep_routine);
    const firstMessage = formatSleepRoutineMessage(sleepRoutine);

    // Step 3: Send message as first message to longevity coach
    // Query routines (will be empty for new user)

    const { data: activeRoutine } = await adminClient
      .from('user_routines')
      .select('id, content, version, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    const { data: draftRoutine } = await adminClient
      .from('user_routines')
      .select('id, content, version, created_at, updated_at')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .single();

    // Create a Supabase client with the session token for the agent
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseWithSession = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    });

    const agent = mastra.getAgent('longevityCoachAgent');
    const runtimeContext = new RuntimeContext();
    runtimeContext.set('userId', userId);
    runtimeContext.set('supabase', supabaseWithSession);
    runtimeContext.set('activeRoutine', activeRoutine || null);
    runtimeContext.set('draftRoutine', draftRoutine || null);

    // Send the first message to the longevity coach
    // We don't need to wait for the full response, just trigger it
    try {
      const threadId = `longevity-coach-${userId}`;
      await agent.generate(firstMessage, {
        memory: {
          thread: threadId,
          resource: `longevity-coach-${userId}`,
        },
        runtimeContext,
      });
    } catch (error) {
      // Log error but don't fail the onboarding - the message can be sent later
      console.error('Error sending summary to longevity coach:', error);
    }

    // Step 4: Return session data
    return Response.json({
      success: true,
      userId,
      session,
    });
  } catch (error) {
    console.error('Error in complete-onboarding:', error);
    return Response.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


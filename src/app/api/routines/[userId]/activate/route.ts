import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isProUser } from '@/lib/subscription';

// POST: Activate draft routine
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has pro subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single();

    // Handle case where no subscription exists (PGRST116 = no rows found, which is expected for non-subscribers)
    const hasSubscription = subscription && (!subscriptionError || subscriptionError.code !== 'PGRST116');
    const isPro = hasSubscription && isProUser(subscription);

    // Check if this is first activation (no active or past routines)
    const { data: existingRoutines, error: routinesError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'past'])
      .limit(1);

    const isFirstActivation = !existingRoutines || existingRoutines.length === 0;

    // Block activation if not pro
    if (!isPro) {
      if (isFirstActivation) {
        return NextResponse.json(
          { error: 'To activate your first routine, you need a Pro subscription. Please upgrade to continue.' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: 'A Pro subscription is required to activate routines. Please upgrade to continue.' },
          { status: 403 }
        );
      }
    }

    // Find draft routine
    const { data: draft, error: findError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No draft routine exists to activate.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Failed to find draft: ${findError.message}` },
        { status: 500 }
      );
    }

    // Mark any currently active routine as past
    await supabase
      .from('user_routines')
      .update({ status: 'past' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null);

    // Activate the draft
    const { data: activatedRoutine, error: activateError } = await supabase
      .from('user_routines')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id)
      .select('id, content, version, created_at, updated_at')
      .single();

    if (activateError) {
      return NextResponse.json(
        { error: `Failed to activate draft: ${activateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ routine: activatedRoutine });
  } catch (error) {
    console.error('Error in activate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


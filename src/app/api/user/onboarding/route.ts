import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, onboarding_completed_at')
      .eq('id', user.id)
      .single();

    if (error) {
      return Response.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
    }

    return Response.json({
      onboarding_completed: profile?.onboarding_completed || false,
      onboarding_completed_at: profile?.onboarding_completed_at || null,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Mark onboarding complete
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return Response.json({ error: 'Failed to mark onboarding complete' }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Onboarding marked as complete',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update onboarding status (for admin or reset purposes)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { onboarding_completed } = await request.json();

    const updateData: any = {
      onboarding_completed,
    };

    if (onboarding_completed) {
      updateData.onboarding_completed_at = new Date().toISOString();
    } else {
      updateData.onboarding_completed_at = null;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      return Response.json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Onboarding status updated',
      onboarding_completed,
      onboarding_completed_at: updateData.onboarding_completed_at,
    });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}


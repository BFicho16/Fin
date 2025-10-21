import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; planId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedParams = await params;
    if (!user || user.id !== resolvedParams.userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch wellness plan details
    const { data: plan, error: planError } = await supabase
      .from('wellness_plans')
      .select('*')
      .eq('id', resolvedParams.planId)
      .eq('user_id', resolvedParams.userId)
      .single();

    if (planError) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    return Response.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; planId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedParams = await params;
    if (!user || user.id !== resolvedParams.userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Update wellness plan
    const { data: plan, error: planError } = await supabase
      .from('wellness_plans')
      .update(updates)
      .eq('id', resolvedParams.planId)
      .eq('user_id', resolvedParams.userId)
      .select()
      .single();

    if (planError) {
      return Response.json({ error: 'Failed to update plan' }, { status: 400 });
    }

    return Response.json({ plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; planId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedParams = await params;
    if (!user || user.id !== resolvedParams.userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete wellness plan
    const { error: planError } = await supabase
      .from('wellness_plans')
      .delete()
      .eq('id', resolvedParams.planId)
      .eq('user_id', resolvedParams.userId);

    if (planError) {
      return Response.json({ error: 'Failed to delete plan' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

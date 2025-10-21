import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('wellness_plans')
      .select('*')
      .eq('user_id', resolvedParams.userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: plans, error: plansError } = await query.order('created_at', { ascending: false });

    if (plansError) {
      return Response.json({ error: 'Failed to fetch plans' }, { status: 400 });
    }

    return Response.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const plan = await request.json();

    // Create new wellness plan
    const { data: newPlan, error: planError } = await supabase
      .from('wellness_plans')
      .insert({
        user_id: resolvedParams.userId,
        ...plan,
      })
      .select()
      .single();

    if (planError) {
      return Response.json({ error: 'Failed to create plan' }, { status: 400 });
    }

    return Response.json({ plan: newPlan });
  } catch (error) {
    console.error('Error creating plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

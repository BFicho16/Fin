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

    // Get user goals
    const { data: goals, error: goalsError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', resolvedParams.userId)
      .order('priority', { ascending: true });

    if (goalsError) {
      return Response.json({ error: 'Failed to fetch goals' }, { status: 400 });
    }

    return Response.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
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

    const goal = await request.json();

    // Create new goal
    const { data: newGoal, error: goalError } = await supabase
      .from('user_goals')
      .insert({
        user_id: resolvedParams.userId,
        ...goal,
      })
      .select()
      .single();

    if (goalError) {
      return Response.json({ error: 'Failed to create goal' }, { status: 400 });
    }

    return Response.json({ goal: newGoal });
  } catch (error) {
    console.error('Error creating goal:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

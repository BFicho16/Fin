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
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // Build query
    let query = supabase
      .from('steps')
      .select('*')
      .eq('user_id', resolvedParams.userId)
      .order('logged_date', { ascending: false });

    if (start_date) {
      query = query.gte('logged_date', start_date);
    }
    if (end_date) {
      query = query.lte('logged_date', end_date);
    }

    const { data: steps, error: stepsError } = await query;

    if (stepsError) {
      return Response.json({ error: 'Failed to fetch steps' }, { status: 400 });
    }

    return Response.json({ steps });
  } catch (error) {
    console.error('Error fetching steps:', error);
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

    const stepsData = await request.json();

    // Validate required fields
    if (!stepsData.steps_count) {
      return Response.json({ error: 'Missing required field: steps_count' }, { status: 400 });
    }

    // Use provided date or default to today
    const logged_date = stepsData.logged_date || new Date().toISOString().split('T')[0];

    // Check if steps already exist for this date
    const { data: existingSteps } = await supabase
      .from('steps')
      .select('id')
      .eq('user_id', resolvedParams.userId)
      .eq('logged_date', logged_date)
      .single();

    if (existingSteps) {
      return Response.json({ error: 'Steps already logged for this date' }, { status: 400 });
    }

    // Create new steps entry
    const { data: newSteps, error: stepsError } = await supabase
      .from('steps')
      .insert({
        user_id: resolvedParams.userId,
        steps_count: stepsData.steps_count,
        distance_miles: stepsData.distance_miles || null,
        calories_burned: stepsData.calories_burned || null,
        logged_date: logged_date,
        source: 'manual_entry'
      })
      .select()
      .single();

    if (stepsError) {
      return Response.json({ error: 'Failed to log steps' }, { status: 400 });
    }

    return Response.json({ steps: newSteps });
  } catch (error) {
    console.error('Error logging steps:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

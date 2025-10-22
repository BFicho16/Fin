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
      .from('user_routines')
      .select('*')
      .eq('user_id', resolvedParams.userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: routines, error: routinesError } = await query.order('created_at', { ascending: false });

    if (routinesError) {
      return Response.json({ error: 'Failed to fetch routines' }, { status: 400 });
    }

    return Response.json({ routines });
  } catch (error) {
    console.error('Error fetching routines:', error);
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

    const routine = await request.json();

    // Create new routine
    const { data: newRoutine, error: routineError } = await supabase
      .from('user_routines')
      .insert({
        user_id: resolvedParams.userId,
        ...routine,
      })
      .select()
      .single();

    if (routineError) {
      return Response.json({ error: 'Failed to create routine' }, { status: 400 });
    }

    return Response.json({ routine: newRoutine });
  } catch (error) {
    console.error('Error creating routine:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

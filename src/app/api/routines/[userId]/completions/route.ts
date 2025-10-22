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
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query
    let query = supabase
      .from('routine_completions')
      .select(`
        *,
        routine_items (
          id,
          item_name,
          item_type,
          routine_id,
          user_routines (
            id,
            routine_name
          )
        )
      `)
      .eq('user_id', resolvedParams.userId);

    if (date) {
      query = query.eq('completion_date', date);
    } else if (startDate && endDate) {
      query = query.gte('completion_date', startDate).lte('completion_date', endDate);
    }

    const { data: completions, error: completionsError } = await query
      .order('completed_at', { ascending: false });

    if (completionsError) {
      return Response.json({ error: 'Failed to fetch completions' }, { status: 400 });
    }

    return Response.json({ completions });
  } catch (error) {
    console.error('Error fetching completions:', error);
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

    const { routine_item_id, completion_date } = await request.json();

    // Verify item ownership through routine
    const { data: item, error: itemError } = await supabase
      .from('routine_items')
      .select(`
        id,
        user_routines!inner (
          user_id
        )
      `)
      .eq('id', routine_item_id)
      .eq('user_routines.user_id', resolvedParams.userId)
      .single();

    if (itemError || !item) {
      return Response.json({ error: 'Routine item not found' }, { status: 404 });
    }

    // Create completion record
    const { data: completion, error: completionError } = await supabase
      .from('routine_completions')
      .insert({
        routine_item_id,
        user_id: resolvedParams.userId,
        completion_date: completion_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (completionError) {
      return Response.json({ error: 'Failed to create completion' }, { status: 400 });
    }

    return Response.json({ completion });
  } catch (error) {
    console.error('Error creating completion:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

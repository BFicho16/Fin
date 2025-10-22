import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; routineId: string }> }
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

    // Fetch routine with items
    const { data: routine, error: routineError } = await supabase
      .from('user_routines')
      .select(`
        *,
        routine_items (
          id,
          item_name,
          item_type,
          duration_minutes,
          sets,
          reps,
          weight_kg,
          distance_km,
          calories,
          serving_size,
          notes,
          item_order,
          is_optional,
          created_at,
          updated_at
        )
      `)
      .eq('id', resolvedParams.routineId)
      .eq('user_id', resolvedParams.userId)
      .single();

    if (routineError) {
      return Response.json({ error: 'Routine not found' }, { status: 404 });
    }

    return Response.json({ routine });
  } catch (error) {
    console.error('Error fetching routine:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; routineId: string }> }
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

    // Update routine
    const { data: routine, error: routineError } = await supabase
      .from('user_routines')
      .update(updates)
      .eq('id', resolvedParams.routineId)
      .eq('user_id', resolvedParams.userId)
      .select()
      .single();

    if (routineError) {
      return Response.json({ error: 'Failed to update routine' }, { status: 400 });
    }

    return Response.json({ routine });
  } catch (error) {
    console.error('Error updating routine:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; routineId: string }> }
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

    // Delete routine (cascade will delete items and completions)
    const { error: routineError } = await supabase
      .from('user_routines')
      .delete()
      .eq('id', resolvedParams.routineId)
      .eq('user_id', resolvedParams.userId);

    if (routineError) {
      return Response.json({ error: 'Failed to delete routine' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

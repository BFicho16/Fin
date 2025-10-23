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

    // Verify routine ownership
    const { data: routine, error: routineError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('id', resolvedParams.routineId)
      .eq('user_id', resolvedParams.userId)
      .single();

    if (routineError || !routine) {
      return Response.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Fetch routine items
    const { data: items, error: itemsError } = await supabase
      .from('routine_items')
      .select('*')
      .eq('routine_id', resolvedParams.routineId)
      .order('item_order', { ascending: true });

    if (itemsError) {
      return Response.json({ error: 'Failed to fetch routine items' }, { status: 400 });
    }

    return Response.json({ items });
  } catch (error) {
    console.error('Error fetching routine items:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

    // Verify routine ownership
    const { data: routine, error: routineError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('id', resolvedParams.routineId)
      .eq('user_id', resolvedParams.userId)
      .single();

    if (routineError || !routine) {
      return Response.json({ error: 'Routine not found' }, { status: 404 });
    }

    const item = await request.json();

    // Create new routine item
    const { data: newItem, error: itemError } = await supabase
      .from('routine_items')
      .insert({
        routine_id: resolvedParams.routineId,
        ...item,
      })
      .select()
      .single();

    if (itemError) {
      return Response.json({ error: 'Failed to create routine item' }, { status: 400 });
    }

    return Response.json({ item: newItem });
  } catch (error) {
    console.error('Error creating routine item:', error);
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

    // Verify routine ownership
    const { data: routine, error: routineError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('id', resolvedParams.routineId)
      .eq('user_id', resolvedParams.userId)
      .single();

    if (routineError || !routine) {
      return Response.json({ error: 'Routine not found' }, { status: 404 });
    }

    const { items } = await request.json();

    // Update multiple items (for reordering)
    const updates = items.map((item: any) => ({
      id: item.id,
      item_order: item.item_order,
    }));

    const { data: updatedItems, error: itemsError } = await supabase
      .from('routine_items')
      .upsert(updates, { onConflict: 'id' })
      .select();

    if (itemsError) {
      return Response.json({ error: 'Failed to update routine items' }, { status: 400 });
    }

    return Response.json({ items: updatedItems });
  } catch (error) {
    console.error('Error updating routine items:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

